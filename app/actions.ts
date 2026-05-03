"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appointmentIntakeSchema, managerApplicationSchema, meetingCodeVerificationSchema, progressUpdateSchema, ratingSchema, reportDraftSchema, safetyCheckpointCompletionSchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-state";

function stringArrayFromForm(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function toBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function validationError(error: z.ZodError) {
  return {
    status: "error" as const,
    message: error.issues.map((issue) => issue.message).join(" / ")
  };
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("로그인이 필요합니다. /login에서 매직링크로 로그인해 주세요.");
  }
  return { supabase, user: data.user };
}

async function getDefaultFamilyAndElder(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("가족이 아직 생성되지 않았습니다. Supabase seed 또는 가족 생성 플로우를 먼저 연결하세요.");
  }

  const { data: elder, error: elderError } = await supabase
    .from("elders")
    .select("id")
    .eq("family_id", membership.family_id)
    .limit(1)
    .maybeSingle();

  if (elderError || !elder) {
    throw new Error("부모님 프로필이 없습니다. elders 테이블에 부모님 프로필을 먼저 생성하세요.");
  }

  return { familyId: membership.family_id as string, elderId: elder.id as string };
}

export async function createAppointmentAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = appointmentIntakeSchema.safeParse({
    elderName: String(formData.get("elderName") ?? ""),
    hospitalName: String(formData.get("hospitalName") ?? ""),
    department: String(formData.get("department") ?? ""),
    appointmentDate: String(formData.get("appointmentDate") ?? ""),
    appointmentTime: String(formData.get("appointmentTime") ?? ""),
    meetPlace: String(formData.get("meetPlace") ?? ""),
    pickupMethod: String(formData.get("pickupMethod") ?? "home_front_meet_taxi"),
    mobilityNote: String(formData.get("mobilityNote") ?? ""),
    guardianQuestions: String(formData.get("guardianQuestions") ?? ""),
    shareScopes: stringArrayFromForm(formData, "shareScopes"),
    vehiclePolicyAcknowledged: toBoolean(formData.get("vehiclePolicyAcknowledged"))
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { familyId, elderId } = await getDefaultFamilyAndElder(supabase, user.id);
    const appointmentAt = `${parsed.data.appointmentDate}T${parsed.data.appointmentTime}:00+09:00`;
    const title = `${parsed.data.hospitalName} ${parsed.data.department}`;

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        family_id: familyId,
        elder_id: elderId,
        created_by: user.id,
        title,
        appointment_at: appointmentAt,
        meet_place: parsed.data.meetPlace,
        pickup_method: parsed.data.pickupMethod,
        pickup_note: parsed.data.mobilityNote || null,
        transport_policy_acknowledged: true,
        ops_review_required: parsed.data.pickupMethod === "manager_vehicle_info_only" || parsed.data.pickupMethod === "direct_transport_partner",
        intake_snapshot: {
          elder_name: parsed.data.elderName,
          hospital_name: parsed.data.hospitalName,
          department: parsed.data.department,
          share_scopes: parsed.data.shareScopes
        },
        status: "requested"
      })
      .select("id, meeting_code")
      .single();

    if (error) throw error;

    const questions = parsed.data.guardianQuestions
      ?.split("\n")
      .map((question) => question.trim())
      .filter(Boolean)
      .map((question) => ({ appointment_id: appointment.id, question, created_by: user.id }));

    if (questions && questions.length > 0) {
      const { error: questionError } = await supabase.from("appointment_questions").insert(questions);
      if (questionError) throw questionError;
    }

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      entity_type: "appointment",
      entity_id: appointment.id,
      action: "created_by_child",
      metadata: {
        pickup_method: parsed.data.pickupMethod,
        share_scopes: parsed.data.shareScopes,
        vehicle_policy_acknowledged: true
      }
    });

    revalidatePath("/child");
    return {
      status: "success",
      message: `일정이 저장되었습니다. 만남 암호는 ${appointment.meeting_code}입니다.`,
      payload: { appointmentId: appointment.id }
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "일정 저장 중 오류가 발생했습니다." };
  }
}

export async function createManagerApplicationAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = managerApplicationSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    hasVehicle: toBoolean(formData.get("hasVehicle")),
    directTransportAllowed: toBoolean(formData.get("directTransportAllowed")),
    regions: String(formData.get("regions") ?? ""),
    specialties: String(formData.get("specialties") ?? ""),
    careerSummary: String(formData.get("careerSummary") ?? ""),
    certificationSummary: String(formData.get("certificationSummary") ?? ""),
    vehiclePolicyAcknowledged: toBoolean(formData.get("vehiclePolicyAcknowledged"))
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    await supabase.from("profiles").update({ display_name: parsed.data.displayName, phone: parsed.data.phone, role: "manager" }).eq("id", user.id);

    const directTransportAllowed = parsed.data.directTransportAllowed && false;
    const { error } = await supabase.from("managers").upsert({
      profile_id: user.id,
      approval_status: "pending",
      has_vehicle: parsed.data.hasVehicle,
      direct_transport_allowed: directTransportAllowed,
      direct_transport_policy_note: "기본 서비스에서는 매니저 개인차량 유상운송을 제공하지 않음. 별도 제휴/계약/보험 검증 전까지 직접 운송 불가.",
      career_summary: parsed.data.careerSummary,
      certification_summary: parsed.data.certificationSummary,
      region_codes: parsed.data.regions.split(",").map((item) => item.trim()).filter(Boolean),
      hospital_specialties: parsed.data.specialties.split(",").map((item) => item.trim()).filter(Boolean)
    }, { onConflict: "profile_id" });

    if (error) throw error;
    revalidatePath("/manager");
    return { status: "success", message: "매니저 지원서가 접수되었습니다. 운영실 심사 후 승인됩니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "지원서 저장 중 오류가 발생했습니다." };
  }
}

export async function updateProgressAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = progressUpdateSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    status: String(formData.get("status") ?? "arrived"),
    label: String(formData.get("label") ?? ""),
    description: String(formData.get("description") ?? ""),
    visibleToFamily: toBoolean(formData.get("visibleToFamily"))
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase.from("timeline_events").insert({
      appointment_id: parsed.data.appointmentId,
      status: parsed.data.status,
      label: parsed.data.label,
      description: parsed.data.description,
      visible_to_family: parsed.data.visibleToFamily,
      created_by: user.id
    });
    if (error) throw error;
    revalidatePath("/manager/today");
    revalidatePath("/child");
    return { status: "success", message: "진행상태가 보호자 타임라인에 업데이트되었습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "상태 업데이트 중 오류가 발생했습니다." };
  }
}

export async function submitReportDraftAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = reportDraftSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    visitSummary: String(formData.get("visitSummary") ?? ""),
    doctorInstructions: String(formData.get("doctorInstructions") ?? ""),
    testsAndResults: String(formData.get("testsAndResults") ?? ""),
    medicationNote: String(formData.get("medicationNote") ?? ""),
    costNote: String(formData.get("costNote") ?? ""),
    parentCondition: String(formData.get("parentCondition") ?? ""),
    guardianNextActions: String(formData.get("guardianNextActions") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { data: manager, error: managerError } = await supabase
      .from("managers")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    if (managerError || !manager) throw new Error("매니저 프로필이 필요합니다.");

    const { error } = await supabase.from("reports").upsert({
      appointment_id: parsed.data.appointmentId,
      manager_id: manager.id,
      visit_summary: parsed.data.visitSummary,
      doctor_instructions: parsed.data.doctorInstructions,
      tests_and_results: parsed.data.testsAndResults,
      medication_note: parsed.data.medicationNote,
      cost_note: parsed.data.costNote,
      parent_condition: parsed.data.parentCondition,
      guardian_next_actions: parsed.data.guardianNextActions,
      ops_review_status: "submitted",
      submitted_at: new Date().toISOString()
    }, { onConflict: "appointment_id" });
    if (error) throw error;

    revalidatePath("/ops/reports");
    return { status: "success", message: "리포트 초안이 운영실 검수 대기 상태로 제출되었습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "리포트 제출 중 오류가 발생했습니다." };
  }
}

export async function submitRatingAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = ratingSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    managerId: String(formData.get("managerId") ?? ""),
    safetyRating: formData.get("safetyRating"),
    kindnessRating: formData.get("kindnessRating"),
    accuracyRating: formData.get("accuracyRating"),
    punctualityRating: formData.get("punctualityRating"),
    comment: String(formData.get("comment") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const rating = Math.round((parsed.data.safetyRating + parsed.data.kindnessRating + parsed.data.accuracyRating + parsed.data.punctualityRating) / 4);
    const { error } = await supabase.from("reviews").upsert({
      appointment_id: parsed.data.appointmentId,
      manager_id: parsed.data.managerId,
      reviewer_id: user.id,
      rating,
      safety_rating: parsed.data.safetyRating,
      kindness_rating: parsed.data.kindnessRating,
      accuracy_rating: parsed.data.accuracyRating,
      punctuality_rating_v2: parsed.data.punctualityRating,
      comment: parsed.data.comment
    }, { onConflict: "appointment_id,reviewer_id" });
    if (error) throw error;
    revalidatePath("/child");
    return { status: "success", message: "평가가 제출되었습니다. 매니저 안심도에 반영됩니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "평가 제출 중 오류가 발생했습니다." };
  }
}


export async function verifyMeetingCodeAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = meetingCodeVerificationSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    meetingCode: String(formData.get("meetingCode") ?? ""),
    locationLabel: String(formData.get("locationLabel") ?? ""),
    note: String(formData.get("note") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase } = await getAuthenticatedUser();
    const { data, error } = await supabase.rpc("verify_appointment_handoff", {
      target_appointment_id: parsed.data.appointmentId,
      entered_code: parsed.data.meetingCode,
      location_label: parsed.data.locationLabel || null,
      verification_note: parsed.data.note || null
    });

    if (error) throw error;
    const result = data as { success?: boolean; message?: string } | null;

    revalidatePath("/manager/today");
    revalidatePath("/parent/today");
    revalidatePath("/child");
    revalidatePath("/ops/safety");

    return {
      status: result?.success ? "success" : "error",
      message: result?.message ?? "만남 암호 확인 결과를 받지 못했습니다."
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "만남 암호 확인 중 오류가 발생했습니다." };
  }
}

export async function completeSafetyCheckpointAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = safetyCheckpointCompletionSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    checkpointCode: String(formData.get("checkpointCode") ?? ""),
    label: String(formData.get("label") ?? ""),
    note: String(formData.get("note") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase } = await getAuthenticatedUser();
    const { data, error } = await supabase.rpc("complete_safety_checkpoint", {
      target_appointment_id: parsed.data.appointmentId,
      checkpoint_code: parsed.data.checkpointCode,
      completion_note: parsed.data.note || parsed.data.label
    });

    if (error) throw error;
    const result = data as { success?: boolean; message?: string } | null;

    revalidatePath("/manager/today");
    revalidatePath("/parent/today");
    revalidatePath("/child");
    revalidatePath("/ops/safety");

    return {
      status: result?.success === false ? "error" : "success",
      message: result?.message ?? `${parsed.data.label} 단계가 완료 처리되었습니다.`
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "안심 체크포인트 완료 처리 중 오류가 발생했습니다." };
  }
}

export async function runSafetyEscalationSweepAction(_prevState: ActionResult, _formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await getAuthenticatedUser();
    const { data, error } = await supabase.rpc("escalate_missed_safety_checkpoints");
    if (error) throw error;

    revalidatePath("/ops/safety");
    revalidatePath("/ops/risks");
    return { status: "success", message: `지연 체크포인트 ${data ?? 0}건을 점검했습니다.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "안심 SLA 점검 중 오류가 발생했습니다." };
  }
}
