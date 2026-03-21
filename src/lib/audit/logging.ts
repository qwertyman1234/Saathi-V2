/**
 * Audit Logging Service
 * Tracks sensitive operations for compliance and security
 * IRDA compliance requirement: Log all policy and claim actions
 */

import { supabase } from "@/lib/supabase";

export type AuditAction =
  | "POLICY_CREATED"
  | "POLICY_RENEWED"
  | "POLICY_CANCELLED"
  | "CLAIM_SUBMITTED"
  | "CLAIM_APPROVED"
  | "CLAIM_REJECTED"
  | "CLAIM_AMENDED"
  | "PAYMENT_PROCESSED"
  | "PAYMENT_REFUNDED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "ADMIN_OVERRIDE";

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: AuditAction;
  resourceType: string; // "policy", "claim", "payment", "user"
  resourceId: string;
  details: Record<string, any>;
  adminId?: string; // If action taken by admin
  remarks?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  entry: AuditLogEntry
): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  try {
    // Get user's IP (would need to be determined from backend)
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "";

    const { data, error } = await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details,
      admin_id: entry.adminId,
      remarks: entry.remarks,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.[0]?.id };
  } catch (error) {
    console.error("Error creating audit log:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create audit log",
    };
  }
}

/**
 * Log policy creation
 */
export async function logPolicyCreated(
  userId: string,
  policyId: string,
  planName: string,
  premium: number,
  coverage: number,
  paymentId: string
) {
  return createAuditLog({
    userId,
    action: "POLICY_CREATED",
    resourceType: "policy",
    resourceId: policyId,
    details: {
      planName,
      premium,
      coverage,
      paymentId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log policy renewal
 */
export async function logPolicyRenewed(
  userId: string,
  policyId: string,
  newPremium: number,
  paymentId: string
) {
  return createAuditLog({
    userId,
    action: "POLICY_RENEWED",
    resourceType: "policy",
    resourceId: policyId,
    details: {
      newPremium,
      paymentId,
      renewalDate: new Date().toISOString(),
    },
  });
}

/**
 * Log claim submission
 */
export async function logClaimSubmitted(
  userId: string,
  claimId: string,
  policyId: string,
  hospitalName: string,
  claimAmount: number
) {
  return createAuditLog({
    userId,
    action: "CLAIM_SUBMITTED",
    resourceType: "claim",
    resourceId: claimId,
    details: {
      policyId,
      hospitalName,
      claimAmount,
      submissionDate: new Date().toISOString(),
    },
  });
}

/**
 * Log claim approval (admin action)
 */
export async function logClaimApproved(
  claimId: string,
  policyId: string,
  adminId: string,
  settledAmount: number,
  remarks: string
) {
  return createAuditLog({
    userId: adminId,
    action: "CLAIM_APPROVED",
    resourceType: "claim",
    resourceId: claimId,
    adminId,
    details: {
      policyId,
      settledAmount,
      approvalDate: new Date().toISOString(),
    },
    remarks,
  });
}

/**
 * Log claim rejection (admin action)
 */
export async function logClaimRejected(
  claimId: string,
  policyId: string,
  adminId: string,
  reason: string
) {
  return createAuditLog({
    userId: adminId,
    action: "CLAIM_REJECTED",
    resourceType: "claim",
    resourceId: claimId,
    adminId,
    details: {
      policyId,
      rejectionDate: new Date().toISOString(),
    },
    remarks: reason,
  });
}

/**
 * Log payment processing
 */
export async function logPaymentProcessed(
  userId: string,
  paymentId: string,
  policyId: string,
  amount: number,
  method: string
) {
  return createAuditLog({
    userId,
    action: "PAYMENT_PROCESSED",
    resourceType: "payment",
    resourceId: paymentId,
    details: {
      policyId,
      amount,
      method,
      processDate: new Date().toISOString(),
    },
  });
}

/**
 * Get audit logs for a resource
 */
export async function getAuditLogsForResource(
  resourceType: string,
  resourceId: string
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .order("timestamp", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((log) => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      details: log.details,
      adminId: log.admin_id,
      remarks: log.remarks,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

/**
 * Get audit logs for a user (for privacy audit)
 */
export async function getAuditLogsForUser(userId: string): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((log) => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      details: log.details,
      adminId: log.admin_id,
      remarks: log.remarks,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

/**
 * Generate audit report (for compliance)
 */
export async function generateAuditReport(
  startDate: Date,
  endDate: Date,
  action?: AuditAction
): Promise<AuditLogEntry[]> {
  try {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString());

    if (action) {
      query = query.eq("action", action);
    }

    const { data, error } = await query.order("timestamp", {
      ascending: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((log) => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      details: log.details,
      adminId: log.admin_id,
      remarks: log.remarks,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error("Error generating audit report:", error);
    return [];
  }
}

/**
 * Export audit logs to CSV (for compliance reporting)
 */
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): string {
  const headers = [
    "ID",
    "User ID",
    "Action",
    "Resource Type",
    "Resource ID",
    "Details",
    "Admin ID",
    "Remarks",
    "Timestamp",
  ];

  const rows = logs.map((log) => [
    log.id || "",
    log.userId,
    log.action,
    log.resourceType,
    log.resourceId,
    JSON.stringify(log.details),
    log.adminId || "",
    log.remarks || "",
    log.timestamp?.toISOString() || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
