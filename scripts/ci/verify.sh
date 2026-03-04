#!/usr/bin/env bash
# ==============================================================================
# scripts/ci/verify.sh - P0 Quality Gate: lint, typecheck, build
# ==============================================================================
set -euo pipefail
# PASS when: pnpm lint, pnpm typecheck, pnpm build all succeed
# FAIL when: any command fails (exit != 0)
#
# Usage:
#   ./scripts/ci/verify.sh
#   pnpm -w verify
# ==============================================================================

# Load helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib.sh"

trap cleanup EXIT

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
main() {
    log_step "VERIFY GATE - Quality Checks"
    log_info "Running lint, typecheck, and build checks..."
    
    local start_time
    start_time=$(date +%s)
    local failed=0
    local failed_steps=()
    
    # Step 1: Lint
    log_step "Step 1/3: Lint"
    if pnpm lint; then
        log_success "Lint passed"
    else
        log_error "Lint FAILED"
        failed=1
        failed_steps+=("lint")
    fi
    
    # Step 2: Typecheck
    log_step "Step 2/3: Typecheck"
    if pnpm typecheck; then
        log_success "Typecheck passed"
    else
        log_error "Typecheck FAILED"
        failed=1
        failed_steps+=("typecheck")
    fi
    
    # Step 3: Build
    log_step "Step 3/3: Build"
    if pnpm build; then
        log_success "Build passed"
    else
        log_error "Build FAILED"
        failed=1
        failed_steps+=("build")
    fi
    
    # Summary
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    log_step "VERIFY GATE SUMMARY"
    
    if [[ $failed -eq 0 ]]; then
        log_success "✅ VERIFY GATE PASSED in ${duration}s"
        log_info "All quality checks passed: lint, typecheck, build"
        exit 0
    else
        log_error "❌ VERIFY GATE FAILED in ${duration}s"
        log_error "Failed steps: ${failed_steps[*]}"
        exit 1
    fi
}

main "$@"
