package com.greenops.agent.domain.iam;

public interface PermissionGrant {
    String getCode();
    String getResource();
    String getAction();
}
