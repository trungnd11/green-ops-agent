package com.greenops.agent.application.security;

public final class IamPermissions {
    public static final String COMPANY_USER_LIST = "iam.company-user.list";
    public static final String COMPANY_USER_VIEW = "iam.company-user.view";
    public static final String COMPANY_USER_CREATE = "iam.company-user.create";
    public static final String COMPANY_USER_UPDATE = "iam.company-user.update";
    public static final String COMPANY_USER_REMOVE = "iam.company-user.remove";
    public static final String COMPANY_USER_ASSIGN_ROLE = "iam.company-user.assign-role";
    public static final String COMPANY_ROLE_LIST = "iam.company-role.list";
    public static final String COMPANY_ROLE_VIEW = "iam.company-role.view";
    public static final String COMPANY_ROLE_CREATE = "iam.company-role.create";
    public static final String COMPANY_ROLE_UPDATE = "iam.company-role.update";
    public static final String COMPANY_ROLE_DELETE = "iam.company-role.delete";
    public static final String COMPANY_ROLE_ASSIGN_PERMISSION = "iam.company-role.assign-permission";
    public static final String PERMISSION_LIST = "iam.permission.list";
    public static final String PERMISSION_VIEW = "iam.permission.view";
    public static final String PERMISSION_CREATE = "iam.permission.create";
    public static final String PERMISSION_UPDATE = "iam.permission.update";
    public static final String PERMISSION_DELETE = "iam.permission.delete";
    public static final String MODULE_LIST = "iam.module.list";
    public static final String MODULE_CREATE = "iam.module.create";
    public static final String MODULE_UPDATE = "iam.module.update";
    public static final String MODULE_DELETE = "iam.module.delete";

    private IamPermissions() {
    }
}
