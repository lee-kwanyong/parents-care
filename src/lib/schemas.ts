import { z } from "zod";

const requiredText = z.string().trim().min(1, "필수 입력입니다.");

export const appointmentIntakeSchema = z.object({
  elderName: requiredText,
  hospitalName: requiredText,
  department: requiredText,
  appointmentDate: requiredText,
  appointmentTime: requiredText,
  meetPlace: requiredText,
  pickupMethod: z.enum([
    "hospital_front_meet",
    "home_front_meet_taxi",
    "mobility_partner",
    "manager_vehicle_info_only",
    "direct_transport_partner"
  ]),
  mobilityNote: z.string().trim().optional(),
  guardianQuestions: z.string().trim().optional(),
  shareScopes: z.array(z.string()).default([]),
  vehiclePolicyAcknowledged: z.coerce.boolean().refine((value) => value, "차량/운송 분리 정책 확인이 필요합니다.")
});

export const managerApplicationSchema = z.object({
  displayName: requiredText,
  phone: requiredText,
  hasVehicle: z.coerce.boolean().default(false),
  directTransportAllowed: z.coerce.boolean().default(false),
  regions: requiredText,
  specialties: requiredText,
  careerSummary: requiredText,
  certificationSummary: z.string().trim().optional(),
  vehiclePolicyAcknowledged: z.coerce.boolean().refine((value) => value, "차량 보유와 직접 운송 분리 확인이 필요합니다.")
});

export const progressUpdateSchema = z.object({
  appointmentId: requiredText,
  status: z.enum(["arrived", "picked_up", "checked_in", "doctor_consult", "pharmacy", "completed", "exception"]),
  label: requiredText,
  description: z.string().trim().optional(),
  visibleToFamily: z.coerce.boolean().default(true)
});

export const reportDraftSchema = z.object({
  appointmentId: requiredText,
  visitSummary: requiredText,
  doctorInstructions: requiredText,
  testsAndResults: z.string().trim().optional(),
  medicationNote: z.string().trim().optional(),
  costNote: z.string().trim().optional(),
  parentCondition: requiredText,
  guardianNextActions: requiredText
});

export const ratingSchema = z.object({
  appointmentId: requiredText,
  managerId: requiredText,
  safetyRating: z.coerce.number().int().min(1).max(5),
  kindnessRating: z.coerce.number().int().min(1).max(5),
  accuracyRating: z.coerce.number().int().min(1).max(5),
  punctualityRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().optional()
});

export const meetingCodeVerificationSchema = z.object({
  appointmentId: requiredText,
  meetingCode: z.string().trim().regex(/^\d{4,8}$/, "만남 암호는 4~8자리 숫자로 입력해 주세요."),
  locationLabel: z.string().trim().optional(),
  note: z.string().trim().optional()
});

export const safetyCheckpointCompletionSchema = z.object({
  appointmentId: requiredText,
  checkpointCode: z.enum([
    "pre_call",
    "handoff_code",
    "departure_confirmed",
    "hospital_checkin",
    "doctor_consult_update",
    "pharmacy_payment",
    "safe_return_close"
  ]),
  label: requiredText,
  note: z.string().trim().optional()
});

export const prepItemCompletionSchema = z.object({
  appointmentId: requiredText,
  itemTitle: requiredText,
  category: z.string().trim().default("document"),
  note: z.string().trim().optional()
});

export const documentRequestSchema = z.object({
  appointmentId: requiredText,
  title: requiredText,
  reason: requiredText,
  requiredConsentScope: z.string().trim().default("payment_receipt"),
  shareWithFamily: z.coerce.boolean().default(true)
});

export const medicationReminderSchema = z.object({
  appointmentId: requiredText,
  medicineName: requiredText,
  dose: requiredText,
  timing: requiredText,
  reminderAt: requiredText,
  ownerLabel: z.string().trim().optional()
});

export const nextVisitDraftSchema = z.object({
  appointmentId: requiredText,
  title: requiredText,
  suggestedDate: requiredText,
  suggestedTime: requiredText,
  reason: requiredText,
  ownerLabel: z.string().trim().optional()
});

export const quickFamilyTaskSchema = z.object({
  appointmentId: requiredText,
  title: requiredText,
  description: z.string().trim().optional(),
  ownerLabel: z.string().trim().optional(),
  dueAt: z.string().trim().optional()
});

export const careRequestSchema = z.object({
  elderName: requiredText,
  category: z.enum(["hospital", "meal", "medication", "discharge", "documents", "regular_visit", "lonely", "emergency", "unknown"]),
  urgency: z.enum(["today", "soon", "regular", "unknown"]),
  preferredChannel: z.enum(["phone", "kakao", "photo", "direct"]),
  sourceInputType: z.enum(["phone", "kakao", "photo", "direct"]).default("direct"),
  situation: requiredText,
  desiredHelp: z.string().trim().optional(),
  callbackPhone: z.string().trim().optional(),
  notSure: z.coerce.boolean().default(false),
  socialSupportRequested: z.coerce.boolean().default(false)
});

export const carePassportUpdateSchema = z.object({
  elderName: requiredText,
  mobilityNote: z.string().trim().optional(),
  hearingNote: z.string().trim().optional(),
  mealNote: z.string().trim().optional(),
  medicationNote: z.string().trim().optional(),
  fallRisk: z.coerce.boolean().default(false),
  preferredTone: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional()
});

export const mealCheckSchema = z.object({
  elderName: requiredText,
  mealTime: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  eatenStatus: z.enum(["ate", "not_yet", "skipped", "unknown"]),
  note: z.string().trim().optional(),
  deliveryInterest: z.coerce.boolean().default(false)
});

export const carePackRequestSchema = z.object({
  elderName: requiredText,
  packCode: z.enum([
    "hospital_day",
    "meal_subscription",
    "medication_check",
    "discharge_7days",
    "documents_insurance",
    "regular_visit",
    "companionship_checkin",
    "not_sure_consult"
  ]),
  preferredChannel: z.enum(["phone", "kakao", "photo", "direct"]),
  urgency: z.enum(["today", "soon", "regular", "unknown"]),
  situation: requiredText,
  callbackPhone: z.string().trim().optional(),
  socialSupportRequested: z.coerce.boolean().default(false),
  easyModeConfirmed: z.coerce.boolean().default(false)
});
