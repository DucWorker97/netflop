#!/usr/bin/env bash
# ==============================================================================
# scripts/ci/lib.sh - Shared helper functions for CI scripts
# ==============================================================================
# Usage: source this file at the top of other CI scripts
#   source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
# ==============================================================================

set -euo pipefail
IFS=$'\n\t'

# ------------------------------------------------------------------------------
# Colors & Formatting
# ------------------------------------------------------------------------------
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# ------------------------------------------------------------------------------
# Logging Functions
# ------------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $*" >&2
}

log_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶${NC} $*"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ------------------------------------------------------------------------------
# fail - Print error message and exit with code 1
# ------------------------------------------------------------------------------
fail() {
    log_error "$@"
    exit 1
}

# ------------------------------------------------------------------------------
# require_env - Check that an environment variable is set
# Usage: require_env VAR_NAME
# ------------------------------------------------------------------------------
require_env() {
    local var_name="$1"
    if [[ -z "${!var_name:-}" ]]; then
        fail "Required environment variable '$var_name' is not set"
    fi
}

# ------------------------------------------------------------------------------
# require_cmd - Check that a command exists
# Usage: require_cmd command_name
# ------------------------------------------------------------------------------
require_cmd() {
    local cmd="$1"
    if ! command -v "$cmd" &> /dev/null; then
        fail "Required command '$cmd' is not installed"
    fi
}

# ------------------------------------------------------------------------------
# retry - Retry a command with exponential backoff
# Usage: retry <max_attempts> <delay_seconds> <command...>
# Example: retry 5 2 curl -s http://localhost:3000/health
# ------------------------------------------------------------------------------
retry() {
    local max_attempts="$1"
    local delay="$2"
    shift 2
    local cmd=("$@")
    
    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if "${cmd[@]}"; then
            return 0
        fi
        
        if [[ $attempt -lt $max_attempts ]]; then
            log_warn "Attempt $attempt/$max_attempts failed. Retrying in ${delay}s..."
            sleep "$delay"
            # Exponential backoff (cap at 30s)
            delay=$((delay * 2))
            [[ $delay -gt 30 ]] && delay=30
        fi
        
        ((attempt++))
    done
    
    log_error "Command failed after $max_attempts attempts: ${cmd[*]}"
    return 1
}

# ------------------------------------------------------------------------------
# wait_for_url - Wait for a URL to return HTTP 2xx/3xx
# Usage: wait_for_url <url> <timeout_seconds> [expected_status]
# Example: wait_for_url http://localhost:3000/health 60
# ------------------------------------------------------------------------------
wait_for_url() {
    local url="$1"
    local timeout="${2:-60}"
    local expected="${3:-200}"
    
    log_info "Waiting for $url (timeout: ${timeout}s, expected: HTTP $expected)"
    
    local start_time
    start_time=$(date +%s)
    
    while true; do
        local current_time
        current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -ge $timeout ]]; then
            log_error "Timeout waiting for $url after ${timeout}s"
            return 1
        fi
        
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [[ "$status" == "$expected" ]] || [[ "$status" =~ ^2[0-9][0-9]$ ]] || [[ "$status" =~ ^3[0-9][0-9]$ ]]; then
            log_success "URL $url is reachable (HTTP $status)"
            return 0
        fi
        
        echo -n "."
        sleep 2
    done
}

# ------------------------------------------------------------------------------
# wait_for_healthy - Wait for docker compose services to be healthy
# Usage: wait_for_healthy <timeout_seconds> [service_names...]
# Example: wait_for_healthy 90 postgres redis minio
# ------------------------------------------------------------------------------
wait_for_healthy() {
    local timeout="$1"
    shift
    local services=("$@")
    
    log_info "Waiting for services to be healthy (timeout: ${timeout}s)"
    
    local start_time
    start_time=$(date +%s)
    
    while true; do
        local current_time
        current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -ge $timeout ]]; then
            log_error "Timeout waiting for healthy services after ${timeout}s"
            docker compose ps
            return 1
        fi
        
        local all_healthy=true
        for service in "${services[@]}"; do
            local health
            health=$(docker compose ps --format json "$service" 2>/dev/null | jq -r '.Health // "unknown"' 2>/dev/null || echo "unknown")
            
            if [[ "$health" != "healthy" ]]; then
                all_healthy=false
                break
            fi
        done
        
        if [[ "$all_healthy" == "true" ]]; then
            log_success "All services are healthy"
            return 0
        fi
        
        echo -n "."
        sleep 2
    done
}

# ------------------------------------------------------------------------------
# mask_secrets - Mask sensitive query strings in URLs (for logging)
# Usage: echo "$url" | mask_secrets
# ------------------------------------------------------------------------------
mask_secrets() {
    sed -E 's/(X-Amz-Signature=)[^&]+/\1***MASKED***/g' \
      | sed -E 's/(X-Amz-Credential=)[^&]+/\1***MASKED***/g' \
      | sed -E 's/(token=)[^&]+/\1***MASKED***/g' \
      | sed -E 's/(password=)[^&]+/\1***MASKED***/g'
}

# ------------------------------------------------------------------------------
# run_step - Run a command as a named step with timing
# Usage: run_step "Step Name" command args...
# ------------------------------------------------------------------------------
run_step() {
    local step_name="$1"
    shift
    local cmd=("$@")
    
    log_step "$step_name"
    
    local start_time
    start_time=$(date +%s)
    
    if "${cmd[@]}"; then
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "$step_name completed in ${duration}s"
        return 0
    else
        local exit_code=$?
        log_error "$step_name FAILED (exit code: $exit_code)"
        log_error "Command: ${cmd[*]}"
        return $exit_code
    fi
}

# ------------------------------------------------------------------------------
# cleanup - Cleanup function for traps
# Usage: trap cleanup EXIT
# ------------------------------------------------------------------------------
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script failed with exit code $exit_code"
    fi
    return $exit_code
}

# ------------------------------------------------------------------------------
# Script Info
# ------------------------------------------------------------------------------
log_info "lib.sh loaded - CI helper functions ready"
