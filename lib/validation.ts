/**
 * Validate phone number
 * Must be exactly 10 digits starting with 0
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const trimmed = phone.trim()

  if (!trimmed) {
    return { valid: false, error: "Phone number is required" }
  }

  // Remove any spaces or dashes
  const cleaned = trimmed.replace(/[\s-]/g, "")

  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, error: "Phone number must be exactly 10 digits" }
  }

  if (!cleaned.startsWith("0")) {
    return { valid: false, error: "Phone number must start with 0" }
  }

  return { valid: true }
}

/**
 * Validate vehicle number
 * Allowed formats (with or without hyphen):
 * - AB-1234 or AB1234 (2 letters, 4 digits)
 * - ABC-1234 or ABC1234 (3 letters, 4 digits)
 * - 300-1234 or 3001234 (3 digits, 4 digits)
 * - 65-1234 or 651234 (2 digits, 4 digits)
 */
export function validateVehicleNumber(
  vehicleNo: string
): { valid: boolean; error?: string } {
  const trimmed = vehicleNo.trim().toUpperCase()

  if (!trimmed) {
    return { valid: false, error: "Vehicle number is required" }
  }

  // Pattern: (2-3 letters OR 2-3 digits) followed by optional hyphen and 4 digits
  const patterns = [
    /^[A-Z]{2}-?\d{4}$/, // AB-1234 or AB1234
    /^[A-Z]{3}-?\d{4}$/, // ABC-1234 or ABC1234
    /^\d{3}-?\d{4}$/, // 300-1234 or 3001234
    /^\d{2}-?\d{4}$/, // 65-1234 or 651234
  ]

  const isValid = patterns.some((pattern) => pattern.test(trimmed))

  if (!isValid) {
    return {
      valid: false,
      error: "Invalid format. Use: AB1234, ABC1234, 3001234, or 651234",
    }
  }

  return { valid: true }
}

/**
 * Validate all booking form fields
 */
export function validateBookingForm(
  customerName: string,
  phone: string,
  vehicleNo: string
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!customerName.trim()) {
    errors.name = "Name is required"
  } else if (customerName.trim().length > 25) {
    errors.name = "Name must be 25 characters or less"
  }

  const phoneValidation = validatePhone(phone)
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error || "Invalid phone number"
  }

  const vehicleValidation = validateVehicleNumber(vehicleNo)
  if (!vehicleValidation.valid) {
    errors.vehicle = vehicleValidation.error || "Invalid vehicle number"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
