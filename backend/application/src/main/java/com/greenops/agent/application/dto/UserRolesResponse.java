package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRolesResponse {
    private List<RoleItem> roles;
    private List<PermissionGroup> permissionGroups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleItem {
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionGroup {
        private String module;
        private List<PermissionItem> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionItem {
        private String code;
        private String name;
    }
}
