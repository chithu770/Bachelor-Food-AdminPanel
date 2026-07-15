export function validateAuth(values, mode = "login") {
  const errors = {};
  if (mode === "register" && !values.name?.trim()) errors.name = "Name is required";
  if (!values.email?.trim()) errors.email = "Email is required";
  if (!values.password || values.password.length < 6) errors.password = "Password must be at least 6 characters";
  return errors;
}

export function validateProduct(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = "Product name is required";
  if (!values.hotelName?.trim()) errors.hotelName = "Hotel name is required";
  if (!Number(values.price)) errors.price = "Valid price is required";
  return errors;
}

export function validateHotel(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = "Hotel name is required";
  if (!values.location?.trim()) errors.location = "Location is required";
  if (!values.phone?.trim()) errors.phone = "Phone number is required";
  return errors;
}
