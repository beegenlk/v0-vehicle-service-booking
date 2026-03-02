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
 * Allowed formats:
 * - AB-1234 (2 letters, hyphen, 4 digits)
 * - ABC-1234 (3 letters, hyphen, 4 digits)
 * - 300-1234 (3 digits, hyphen, 4 digits)
 * - 65-1234 (2 digits, hyphen, 4 digits)
 */
export function validateVehicleNumber(
  vehicleNo: string
): { valid: boolean; error?: string } {
  const trimmed = vehicleNo.trim().toUpperCase()

  if (!trimmed) {
    return { valid: false, error: "Vehicle number is required" }
  }

  // Pattern: (2-3 letters OR 2-3 digits) - 4 digits
  const patterns = [
    /^[A-Z]{2}-\d{4}$/, // AB-1234
    /^[A-Z]{3}-\d{4}$/, // ABC-1234
    /^\d{3}-\d{4}$/, // 300-1234
    /^\d{2}-\d{4}$/, // 65-1234
  ]

  const isValid = patterns.some((pattern) => pattern.test(trimmed))

  if (!isValid) {
    return {
      valid: false,
      error: "Invalid format. Use: AB-1234, ABC-1234, 300-1234, or 65-1234",
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
