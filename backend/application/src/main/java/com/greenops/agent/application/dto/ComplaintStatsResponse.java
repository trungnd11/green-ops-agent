package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintStatsResponse {
    private long pending;
    private long processing;
    private long resolved;
    private long rejected;
}
