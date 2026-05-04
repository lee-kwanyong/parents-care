export type MealPreference = { softFood?: boolean; lowSalt?: boolean; diabetic?: boolean; recoveryMeal?: boolean }
export function recommendMealOptions(preference: MealPreference) {
  const options = ['식사 확인만 하기', '일반 도시락/반찬 정기배송']
  if (preference.softFood) options.push('연화식·죽 중심 식단 상담')
  if (preference.lowSalt) options.push('저염식 식단 상담')
  if (preference.diabetic) options.push('당뇨식 식단 상담')
  if (preference.recoveryMeal) options.push('퇴원 후 회복식 7일팩')
  return options
}
