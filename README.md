# CloudGuard

## Cloud Cost Optimization & Performance Assurance

CloudGuard is a performance-safe cloud rightsizing solution designed for university cloud laboratories.

It helps reduce cloud infrastructure costs while maintaining required performance, latency, availability, and service-level targets.

## Problem Statement

Universities run cloud laboratories for different courses and semesters. Cloud resources are often provisioned based on changing usage patterns, making cost-saving decisions difficult.

Aggressive cost reduction can negatively affect application performance and availability.

CloudGuard addresses this problem by modelling usage patterns and evaluating cost-saving actions against performance and service-level requirements.

## Objectives

- Reduce cloud infrastructure cost safely.
- Maintain acceptable latency and availability.
- Analyze CPU, memory, request volume, and workload patterns.
- Compare different resource-sizing options.
- Simulate the impact of cost-saving actions.
- Identify performance risks before applying optimization.
- Provide configurable decision rules instead of hard-coded decisions.
- Support multiple organizational roles.

## Key Features

### 1. Performance-Safe Rightsizing

Evaluates whether reducing or increasing cloud resources can achieve cost savings without violating performance targets.

### 2. Cost vs Performance Analysis

Compares estimated infrastructure cost with CPU utilization, memory usage, latency, request volume, and availability.

### 3. Scenario Simulation

Supports multiple operating scenarios:

- Low workload
- Normal workload
- Peak workload

### 4. Sensitivity Analysis

Tests how changes in important assumptions affect optimization decisions.

Key assumptions include:

- CPU utilization
- Memory utilization
- Request volume
- Latency target
- Instance pricing
- Availability target

### 5. Failure-State Analysis

Identifies cases where cost reduction may cause:

- High latency
- Resource saturation
- Availability degradation
- Insufficient capacity
- Sudden workload spikes

### 6. Configurable Rules

Optimization decisions are controlled through configurable thresholds and rules rather than fixed hard-coded decisions.

## Organizational Roles

### Cloud Administrator

- Reviews resource utilization.
- Configures optimization rules.
- Evaluates infrastructure recommendations.

### Course / Lab Manager

- Reviews laboratory workload requirements.
- Monitors performance targets.
- Validates recommended resource changes.

## Input Metrics

| Metric | Purpose |
|---|---|
| CPU Utilization | Measures processor workload |
| Memory Utilization | Measures memory pressure |
| Request Volume | Represents workload demand |
| Latency | Measures service responsiveness |
| Instance Pricing | Calculates infrastructure cost |
| Availability | Ensures service reliability |

## Decision Process

```text
Workload Data
      ↓
Baseline Measurement
      ↓
Usage Pattern Analysis
      ↓
Resource Rightsizing
      ↓
Cost & Performance Simulation
      ↓
Scenario Comparison
      ↓
Sensitivity Analysis
      ↓
Performance-Safe Recommendation
