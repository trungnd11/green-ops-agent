package com.greenops.agent.application.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " không tìm thấy với ID: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
