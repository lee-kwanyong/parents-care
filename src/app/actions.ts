"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appointmentIntakeSchema, carePackRequestSchema, carePassportUpdateSchema, careRequestSchema, documentRequestSchema, managerApplicationSchema, mealCheckSchema, medicationReminderSchema, meetingCodeVerificationSchema, nextVisitDraftSchema, prepItemCompletionSchema, progressUpdateSchema, quickFamilyTaskSchema, ratingSchema, reportDraftSchema, safetyCheckpointCompletionSchema } from "@/lib/schemas";
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

function revalidateConveniencePaths() {
  revalidatePath("/child");
  revalidatePath("/child/convenience");
  revalidatePath("/child/appointments/demo");
  revalidatePath("/parent/today");
  revalidatePath("/manager/today");
  revalidatePath("/ops/convenience");
  revalidatePath("/care-room");
}

export async function completePrepItemAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = prepItemCompletionSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    itemTitle: String(formData.get("itemTitle") ?? ""),
    category: String(formData.get("category") ?? "document"),
    note: String(formData.get("note") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase.from("appointment_preparation_items").upsert({
      appointment_id: parsed.data.appointmentId,
      title: parsed.data.itemTitle,
      category: parsed.data.category,
      status: "done",
      note: parsed.data.note || null,
      owner_label: "가족/매니저",
      completed_by: user.id,
      completed_at: new Date().toISOString()
    }, { onConflict: "appointment_id,title" });

    if (error) throw error;

    await supabase.from("timeline_events").insert({
      appointment_id: parsed.data.appointmentId,
      status: "scheduled",
      label: `준비 완료: ${parsed.data.itemTitle}`,
      description: parsed.data.note || "일정 준비물 체크가 완료되었습니다.",
      visible_to_family: true,
      created_by: user.id
    });

    revalidateConveniencePaths();
    return { status: "success", message: `${parsed.data.itemTitle} 준비 완료로 기록했습니다.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "준비물 완료 처리 중 오류가 발생했습니다." };
  }
}

export async function requestDocumentAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = documentRequestSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    title: String(formData.get("title") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    requiredConsentScope: String(formData.get("requiredConsentScope") ?? "payment_receipt"),
    shareWithFamily: toBoolean(formData.get("shareWithFamily"))
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase.from("appointment_document_requests").upsert({
      appointment_id: parsed.data.appointmentId,
      title: parsed.data.title,
      reason: parsed.data.reason,
      required_consent_scope: parsed.data.requiredConsentScope,
      share_with_family: parsed.data.shareWithFamily,
      requested_by: user.id,
      status: "requested"
    }, { onConflict: "appointment_id,title" });

    if (error) throw error;

    await supabase.from("appointment_messages").insert({
      appointment_id: parsed.data.appointmentId,
      sender_id: user.id,
      message: `서류 요청: ${parsed.data.title} · ${parsed.data.reason}`,
      visible_to_family: true,
      is_internal: false
    });

    revalidateConveniencePaths();
    return { status: "success", message: `${parsed.data.title} 요청을 매니저 현장 체크리스트에 추가했습니다.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "서류 요청 저장 중 오류가 발생했습니다." };
  }
}

export async function createMedicationReminderAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = medicationReminderSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    medicineName: String(formData.get("medicineName") ?? ""),
    dose: String(formData.get("dose") ?? ""),
    timing: String(formData.get("timing") ?? ""),
    reminderAt: String(formData.get("reminderAt") ?? ""),
    ownerLabel: String(formData.get("ownerLabel") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase.from("appointment_medication_reminders").insert({
      appointment_id: parsed.data.appointmentId,
      medicine_name: parsed.data.medicineName,
      dose: parsed.data.dose,
      timing: parsed.data.timing,
      reminder_at: parsed.data.reminderAt,
      owner_label: parsed.data.ownerLabel || "가족 공동",
      created_by: user.id,
      status: "scheduled"
    });

    if (error) throw error;

    await supabase.from("guardian_tasks").insert({
      appointment_id: parsed.data.appointmentId,
      title: `복약 확인: ${parsed.data.medicineName}`,
      description: `${parsed.data.timing} · ${parsed.data.dose}`,
      owner_label: parsed.data.ownerLabel || "가족 공동",
      due_at: parsed.data.reminderAt,
      source: "system",
      created_by: user.id
    });

    revalidateConveniencePaths();
    return { status: "success", message: `${parsed.data.medicineName} 복약 확인 알림을 만들었습니다.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "복약 알림 생성 중 오류가 발생했습니다." };
  }
}

export async function createNextVisitDraftAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = nextVisitDraftSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    title: String(formData.get("title") ?? ""),
    suggestedDate: String(formData.get("suggestedDate") ?? ""),
    suggestedTime: String(formData.get("suggestedTime") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    ownerLabel: String(formData.get("ownerLabel") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const suggestedAt = `${parsed.data.suggestedDate}T${parsed.data.suggestedTime}:00+09:00`;

    const { error } = await supabase.from("next_visit_candidates").insert({
      source_appointment_id: parsed.data.appointmentId,
      title: parsed.data.title,
      suggested_at: suggestedAt,
      reason: parsed.data.reason,
      owner_label: parsed.data.ownerLabel || "가족 공동",
      status: "drafted",
      created_by: user.id
    });

    if (error) throw error;

    await supabase.from("guardian_tasks").insert({
      appointment_id: parsed.data.appointmentId,
      title: `다음 예약 후보 확인: ${parsed.data.title}`,
      description: parsed.data.reason,
      owner_label: parsed.data.ownerLabel || "가족 공동",
      due_at: suggestedAt,
      source: "system",
      created_by: user.id
    });

    revalidateConveniencePaths();
    return { status: "success", message: `${parsed.data.title} 다음 예약 후보를 만들었습니다.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "다음 예약 후보 생성 중 오류가 발생했습니다." };
  }
}

export async function createQuickFamilyTaskAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = quickFamilyTaskSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    ownerLabel: String(formData.get("ownerLabel") ?? ""),
    dueAt: String(formData.get("dueAt") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase.from("guardian_tasks").insert({
      appointment_id: parsed.data.appointmentId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      owner_label: parsed.data.ownerLabel || "가족 공동",
      due_at: parsed.data.dueAt || null,
      source: "manual",
      created_by: user.id
    });

    if (error) throw error;
    revalidateConveniencePaths();
    return { status: "success", message: "가족 할 일을 추가했습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "가족 할 일 추가 중 오류가 발생했습니다." };
  }
}

function revalidateWorryPaths() {
  revalidatePath("/");
  revalidatePath("/care-request");
  revalidatePath("/care-passport");
  revalidatePath("/care-meals");
  revalidatePath("/child");
  revalidatePath("/ops/requests");
  revalidatePath("/impact");
  revalidatePath("/care-difference");
  revalidatePath("/care-packs");
}

const carePlanTemplates: Record<string, Array<{ title: string; description: string; owner_role: string; due_hint: string }>> = {
  hospital: [
    { title: "예약 정보 정리", description: "예약 문자·사진·카톡 내용을 병원명, 시간, 준비물, 질문 리스트로 정리합니다.", owner_role: "ops", due_hint: "접수 후 10분 안" },
    { title: "부모님 케어패스포트 확인", description: "거동, 청력, 약, 식사, 낙상 주의사항을 현장 매니저에게 필요한 만큼만 공유합니다.", owner_role: "ops", due_hint: "배정 전" },
    { title: "동행 방식 확정", description: "기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준으로 확정합니다.", owner_role: "ops", due_hint: "보호자 확인 후" },
    { title: "보호자 리포트와 다음 할 일", description: "진료 내용, 약, 서류, 비용, 다음 예약 후보, 가족 할 일을 검수 후 발송합니다.", owner_role: "manager", due_hint: "동행 종료 후" }
  ],
  meal: [
    { title: "식사 위험 확인", description: "혼자 식사 준비 가능 여부, 씹기/삼키기 어려움, 당뇨·저염식 필요 여부를 확인합니다.", owner_role: "ops", due_hint: "오늘" },
    { title: "식사 확인 방식 선택", description: "부모님 큰 버튼, 전화 확인, 매니저 방문 확인 중 가장 쉬운 방식을 고릅니다.", owner_role: "family", due_hint: "상담 중" },
    { title: "안심밥상 연결", description: "도시락, 밑반찬, 죽, 연화식, 회복식 배송 후보를 지역과 상태에 맞춰 안내합니다.", owner_role: "partner", due_hint: "정기 신청 전" },
    { title: "가족 안심 리포트", description: "식사 확인 결과와 미확인 상태를 가족에게 짧게 알려줍니다.", owner_role: "system", due_hint: "매 끼니 후" }
  ],
  medication: [
    { title: "약 정보 정리", description: "처방약 사진, 약 봉투, 복용 시간, 기존 복용약 주의사항을 정리합니다.", owner_role: "family", due_hint: "오늘" },
    { title: "복약 확인표 생성", description: "아침·점심·저녁 복용 확인 버튼과 가족 담당자를 만듭니다.", owner_role: "system", due_hint: "처방 후" },
    { title: "미확인 알림", description: "정해진 시간에 확인이 없으면 자녀에게 확인 필요 상태로 보여줍니다.", owner_role: "system", due_hint: "복용 시간 후" }
  ],
  discharge: [
    { title: "퇴원 당일 플랜", description: "귀가 동행, 약국, 서류, 회복식, 집 도착 확인을 한 흐름으로 묶습니다.", owner_role: "ops", due_hint: "퇴원 전" },
    { title: "7일 안심 체크", description: "식사, 약, 통증, 낙상 위험, 다음 외래를 7일 동안 간단히 확인합니다.", owner_role: "system", due_hint: "퇴원 후 7일" },
    { title: "가족 할 일 정리", description: "다음 외래 예약, 보험서류, 회복식 유지 여부를 가족 할 일로 나눕니다.", owner_role: "ops", due_hint: "퇴원 후 24시간" }
  ],
  documents: [
    { title: "서류 목적 확인", description: "실손보험, 가족 확인, 다음 병원 제출 중 목적에 맞는 서류를 추천합니다.", owner_role: "ops", due_hint: "수납 전" },
    { title: "공유 동의 범위 확인", description: "민감정보가 포함된 서류는 부모님 동의 범위를 먼저 확인합니다.", owner_role: "ops", due_hint: "발급 전" },
    { title: "현장 요청 체크", description: "매니저가 영수증, 세부내역서, 통원확인서, 처방전 등을 현장에서 확인합니다.", owner_role: "manager", due_hint: "수납 시" }
  ],
  regular_visit: [
    { title: "정기진료 주기 확인", description: "몇 주/몇 달마다 방문해야 하는지와 가족이 가능한 요일을 확인합니다.", owner_role: "family", due_hint: "오늘" },
    { title: "케어 캘린더 등록", description: "다음 예약 후보와 알림을 만들고 가족 역할을 나눕니다.", owner_role: "system", due_hint: "리포트 후" },
    { title: "같은 매니저 우선 배정", description: "가능하면 부모님이 익숙한 매니저를 우선 추천합니다.", owner_role: "ops", due_hint: "배정 시" }
  ],
  lonely: [
    { title: "안부 방식 선택", description: "전화, 문자, 큰 버튼 확인 중 부모님이 부담 없는 방식을 고릅니다.", owner_role: "family", due_hint: "오늘" },
    { title: "정기 안부 루틴", description: "식사·약·컨디션을 묻는 짧은 안부 루틴을 만듭니다.", owner_role: "system", due_hint: "매주" },
    { title: "공공/지역 연결", description: "필요 시 복지관, 방문요양, 지역 서비스 안내로 연결합니다.", owner_role: "ops", due_hint: "상담 후" }
  ],
  emergency: [
    { title: "즉시 연락", description: "부모님, 보호자, 매니저, 운영실 순서로 즉시 연락 상태를 확인합니다.", owner_role: "ops", due_hint: "즉시" },
    { title: "위험 플래그 생성", description: "응급, 연락두절, 낙상, 식사/약 위험을 운영실 리스크 보드에 올립니다.", owner_role: "ops", due_hint: "즉시" },
    { title: "필요 시 119/보호자 안내", description: "의학적 긴급 상황은 앱 내 해결이 아니라 즉시 공공 응급체계 연결을 안내합니다.", owner_role: "ops", due_hint: "즉시" }
  ],
  unknown: [
    { title: "상황 듣기", description: "정확한 서비스명을 몰라도 상황만 듣고 필요한 도움을 운영실이 분류합니다.", owner_role: "ops", due_hint: "접수 후 10분 안" },
    { title: "걱정 분류", description: "병원, 식사, 약, 퇴원, 서류, 정기진료, 안부 중 필요한 조합으로 바꿉니다.", owner_role: "ops", due_hint: "상담 중" },
    { title: "간단 플랜 제안", description: "자녀가 확인할 수 있는 1분 요약 플랜을 만듭니다.", owner_role: "system", due_hint: "상담 후" }
  ]
};

export async function createCareRequestAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = careRequestSchema.safeParse({
    elderName: String(formData.get("elderName") ?? ""),
    category: String(formData.get("category") ?? "unknown"),
    urgency: String(formData.get("urgency") ?? "unknown"),
    preferredChannel: String(formData.get("preferredChannel") ?? "phone"),
    sourceInputType: String(formData.get("sourceInputType") ?? formData.get("preferredChannel") ?? "direct"),
    situation: String(formData.get("situation") ?? ""),
    desiredHelp: String(formData.get("desiredHelp") ?? ""),
    callbackPhone: String(formData.get("callbackPhone") ?? ""),
    notSure: toBoolean(formData.get("notSure")),
    socialSupportRequested: toBoolean(formData.get("socialSupportRequested"))
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { familyId, elderId } = await getDefaultFamilyAndElder(supabase, user.id);
    const template = carePlanTemplates[parsed.data.category] ?? carePlanTemplates.unknown;
    const title = parsed.data.category === "unknown" ? "부모님 걱정 상담 요청" : `${parsed.data.elderName} 케어 요청`;

    const { data: request, error } = await supabase
      .from("care_requests")
      .insert({
        family_id: familyId,
        elder_id: elderId,
        requester_id: user.id,
        category: parsed.data.category,
        title,
        situation: parsed.data.situation,
        desired_help: parsed.data.desiredHelp || null,
        preferred_channel: parsed.data.preferredChannel,
        source_input_type: parsed.data.sourceInputType,
        urgency: parsed.data.urgency,
        status: parsed.data.category === "emergency" ? "triaging" : "received",
        not_sure: parsed.data.notSure || parsed.data.category === "unknown",
        callback_phone: parsed.data.callbackPhone || null,
        social_support_requested: parsed.data.socialSupportRequested
      })
      .select("id")
      .single();

    if (error) throw error;

    await supabase.from("care_request_plan_steps").insert(
      template.map((step, index) => ({
        care_request_id: request.id,
        step_order: index + 1,
        title: step.title,
        description: step.description,
        owner_role: step.owner_role,
        due_hint: step.due_hint,
        status: index === 0 ? "todo" : "waiting"
      }))
    );

    await supabase.from("care_request_touchpoints").insert({
      care_request_id: request.id,
      channel: parsed.data.preferredChannel,
      direction: "inbound",
      message: parsed.data.situation,
      handled_by: user.id
    });

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      entity_type: "care_request",
      entity_id: request.id,
      action: "created_worry_intake",
      metadata: {
        category: parsed.data.category,
        urgency: parsed.data.urgency,
        preferred_channel: parsed.data.preferredChannel,
        not_sure: parsed.data.notSure,
        social_support_requested: parsed.data.socialSupportRequested
      }
    });

    revalidateWorryPaths();
    return { status: "success", message: "걱정이 접수되었습니다. 운영실이 1분 요약 플랜으로 정리합니다.", payload: { careRequestId: request.id } };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "걱정 접수 중 오류가 발생했습니다." };
  }
}

export async function saveCarePassportAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = carePassportUpdateSchema.safeParse({
    elderName: String(formData.get("elderName") ?? ""),
    mobilityNote: String(formData.get("mobilityNote") ?? ""),
    hearingNote: String(formData.get("hearingNote") ?? ""),
    mealNote: String(formData.get("mealNote") ?? ""),
    medicationNote: String(formData.get("medicationNote") ?? ""),
    fallRisk: toBoolean(formData.get("fallRisk")),
    preferredTone: String(formData.get("preferredTone") ?? ""),
    emergencyContact: String(formData.get("emergencyContact") ?? "")
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { elderId } = await getDefaultFamilyAndElder(supabase, user.id);

    const { error } = await supabase.from("elder_care_profiles").upsert({
      elder_id: elderId,
      mobility_level: parsed.data.mobilityNote ? "slow_walk" : "unknown",
      hearing_note: parsed.data.hearingNote || null,
      medication_caution: parsed.data.medicationNote || null,
      fall_risk: parsed.data.fallRisk,
      preferred_call_name: parsed.data.elderName,
      important_notes: [
        parsed.data.mobilityNote ? `거동: ${parsed.data.mobilityNote}` : null,
        parsed.data.mealNote ? `식사: ${parsed.data.mealNote}` : null,
        parsed.data.preferredTone ? `응대: ${parsed.data.preferredTone}` : null,
        parsed.data.emergencyContact ? `긴급 연락: ${parsed.data.emergencyContact}` : null
      ].filter(Boolean).join("\n")
    }, { onConflict: "elder_id" });

    if (error) throw error;
    await supabase.from("care_passport_events").insert({
      elder_id: elderId,
      updated_by: user.id,
      event_type: "family_update",
      summary: "가족이 부모님 케어패스포트를 업데이트했습니다.",
      payload: parsed.data
    });

    revalidateWorryPaths();
    return { status: "success", message: "부모님 케어패스포트를 저장했습니다. 다음 동행과 식사·약 확인에 반영됩니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "케어패스포트 저장 중 오류가 발생했습니다." };
  }
}

export async function recordMealCheckAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = mealCheckSchema.safeParse({
    elderName: String(formData.get("elderName") ?? ""),
    mealTime: String(formData.get("mealTime") ?? "lunch"),
    eatenStatus: String(formData.get("eatenStatus") ?? "unknown"),
    note: String(formData.get("note") ?? ""),
    deliveryInterest: toBoolean(formData.get("deliveryInterest"))
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { familyId, elderId } = await getDefaultFamilyAndElder(supabase, user.id);

    const { error } = await supabase.from("meal_checkins").insert({
      family_id: familyId,
      elder_id: elderId,
      meal_time: parsed.data.mealTime,
      eaten_status: parsed.data.eatenStatus,
      note: parsed.data.note || null,
      delivery_interest: parsed.data.deliveryInterest,
      checked_by: user.id
    });
    if (error) throw error;

    if (parsed.data.deliveryInterest) {
      await supabase.from("care_requests").insert({
        family_id: familyId,
        elder_id: elderId,
        requester_id: user.id,
        category: "meal",
        title: `${parsed.data.elderName} 안심밥상 상담`,
        situation: parsed.data.note || "식사 정기배송/회복식 상담이 필요합니다.",
        preferred_channel: "phone",
        source_input_type: "direct",
        urgency: "regular",
        status: "received",
        not_sure: false
      });
    }

    revalidateWorryPaths();
    return { status: "success", message: "식사 확인을 기록했습니다. 가족 안심판에 반영됩니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "식사 확인 저장 중 오류가 발생했습니다." };
  }
}

const packCategoryMap: Record<string, string> = {
  hospital_day: "hospital",
  meal_subscription: "meal",
  medication_check: "medication",
  discharge_7days: "discharge",
  documents_insurance: "documents",
  regular_visit: "regular_visit",
  companionship_checkin: "lonely",
  not_sure_consult: "unknown"
};

export async function createCarePackRequestAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = carePackRequestSchema.safeParse({
    elderName: String(formData.get("elderName") ?? ""),
    packCode: String(formData.get("packCode") ?? "not_sure_consult"),
    preferredChannel: String(formData.get("preferredChannel") ?? "phone"),
    urgency: String(formData.get("urgency") ?? "soon"),
    situation: String(formData.get("situation") ?? ""),
    callbackPhone: String(formData.get("callbackPhone") ?? ""),
    socialSupportRequested: toBoolean(formData.get("socialSupportRequested")),
    easyModeConfirmed: toBoolean(formData.get("easyModeConfirmed"))
  });

  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { familyId, elderId } = await getDefaultFamilyAndElder(supabase, user.id);
    const category = packCategoryMap[parsed.data.packCode] ?? "unknown";
    const template = carePlanTemplates[category] ?? carePlanTemplates.unknown;

    const { data: packRequest, error: packError } = await supabase
      .from("care_pack_requests")
      .insert({
        family_id: familyId,
        elder_id: elderId,
        requester_id: user.id,
        pack_code: parsed.data.packCode,
        preferred_channel: parsed.data.preferredChannel,
        urgency: parsed.data.urgency,
        situation: parsed.data.situation,
        callback_phone: parsed.data.callbackPhone || null,
        social_support_requested: parsed.data.socialSupportRequested,
        easy_mode_confirmed: parsed.data.easyModeConfirmed,
        status: "received"
      })
      .select("id")
      .single();

    if (packError) throw packError;

    const { data: careRequest, error: careRequestError } = await supabase
      .from("care_requests")
      .insert({
        family_id: familyId,
        elder_id: elderId,
        requester_id: user.id,
        category,
        title: `${parsed.data.elderName} 케어팩 요청`,
        situation: parsed.data.situation,
        desired_help: `선택한 케어팩: ${parsed.data.packCode}`,
        preferred_channel: parsed.data.preferredChannel,
        source_input_type: parsed.data.preferredChannel,
        urgency: parsed.data.urgency,
        status: "received",
        not_sure: parsed.data.packCode === "not_sure_consult",
        callback_phone: parsed.data.callbackPhone || null,
        social_support_requested: parsed.data.socialSupportRequested
      })
      .select("id")
      .single();

    if (careRequestError) throw careRequestError;

    await supabase.from("care_pack_tasks").insert(
      template.slice(0, 4).map((step, index) => ({
        care_pack_request_id: packRequest.id,
        step_order: index + 1,
        title: step.title,
        description: step.description,
        owner_role: step.owner_role,
        status: index === 0 ? "todo" : "waiting",
        due_hint: step.due_hint
      }))
    );

    await supabase.from("care_request_plan_steps").insert(
      template.map((step, index) => ({
        care_request_id: careRequest.id,
        step_order: index + 1,
        title: step.title,
        description: step.description,
        owner_role: step.owner_role,
        due_hint: step.due_hint,
        status: index === 0 ? "todo" : "waiting"
      }))
    );

    await supabase.from("assisted_intake_sessions").insert({
      family_id: familyId,
      elder_id: elderId,
      care_request_id: careRequest.id,
      care_pack_request_id: packRequest.id,
      channel: parsed.data.preferredChannel,
      raw_input_summary: parsed.data.situation,
      extracted_summary: {
        pack_code: parsed.data.packCode,
        urgency: parsed.data.urgency,
        easy_mode_confirmed: parsed.data.easyModeConfirmed,
        social_support_requested: parsed.data.socialSupportRequested
      },
      missing_info: parsed.data.callbackPhone ? [] : ["연락받을 번호"],
      status: parsed.data.preferredChannel === "phone" ? "open" : "summarized"
    });

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      entity_type: "care_pack_request",
      entity_id: packRequest.id,
      action: "created_care_pack_request",
      metadata: {
        pack_code: parsed.data.packCode,
        urgency: parsed.data.urgency,
        preferred_channel: parsed.data.preferredChannel,
        social_support_requested: parsed.data.socialSupportRequested,
        easy_mode_confirmed: parsed.data.easyModeConfirmed
      }
    });

    revalidateWorryPaths();
    return { status: "success", message: "케어팩 요청이 접수되었습니다. 운영실이 걱정을 해결 플랜으로 정리합니다.", payload: { carePackRequestId: packRequest.id, careRequestId: careRequest.id } };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "케어팩 요청 중 오류가 발생했습니다." };
  }
}
