package com.greenops.agent.application.exception;

public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public BusinessException(String message) {
        this(ErrorCode.BUSINESS_ERROR, message);
    }

    public BusinessException(String errorCode, String message) {
        this(parse(errorCode), message);
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode.name();
    }

    public ErrorCode getCode() {
        return errorCode;
    }

    private static ErrorCode parse(String errorCode) {
        try {
            return ErrorCode.valueOf(errorCode);
        } catch (IllegalArgumentException ex) {
            return ErrorCode.BUSINESS_ERROR;
        }
    }
}
