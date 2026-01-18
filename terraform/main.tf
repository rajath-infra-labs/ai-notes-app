terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "cloud_run" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "sql_admin" {
  service = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "vpc_access" {
  service = "vpcaccess.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_registry" {
  service = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "app_repo" {
  location      = var.region
  repository_id = "ai-notes-repo"
  description   = "Docker repository for AI Notes App"
  format        = "DOCKER"
  
  depends_on = [google_project_service.artifact_registry]
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "ai-notes-db-instance"
  database_version = "POSTGRES_14"
  region           = var.region
  
  settings {
    tier = var.db_tier
    
    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }
    
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }
  
  deletion_protection = var.deletion_protection
  
  depends_on = [google_project_service.sql_admin]
}

# Database
resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
}

# Database User
resource "google_sql_user" "user" {
  name     = var.database_user
  instance = google_sql_database_instance.postgres.name
  password = var.database_password
}

# VPC Connector for Cloud Run to access Cloud SQL
resource "google_vpc_access_connector" "connector" {
  name          = "ai-notes-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = "default"
  
  depends_on = [google_project_service.vpc_access]
}

# Cloud Run Service
resource "google_cloud_run_service" "app" {
  name     = "ai-notes-app"
  location = var.region
  
  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}/ai-notes-app:latest"
        
        ports {
          container_port = 3000
        }
        
        env {
          name  = "port"
          value = "3000"
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "DATABASE_URL"
          value = "postgresql://${var.database_user}:${var.database_password}@${google_sql_database_instance.postgres.public_ip_address}:5432/${var.database_name}"
        }
        
        env {
          name  = "ANTHROPIC_API_KEY"
          value = var.anthropic_api_key
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
      
      container_concurrency = 80
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.name
        "run.googleapis.com/vpc-access-egress" = "all-traffic"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.cloud_run,
    google_artifact_registry_repository.app_repo
  ]
}

# Allow unauthenticated access (make public)
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
