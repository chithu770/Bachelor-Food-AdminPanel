export function formatCurrency(value) {
  let symbol = "Rs.";
  try {
    const settings = JSON.parse(localStorage.getItem("businessSettings"));
    if (settings && settings.currencySymbol) {
      symbol = settings.currencySymbol;
    }
  } catch (e) {}

  const num = Number(value || 0);
  if (symbol === "₹" || symbol === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  } else if (symbol === "$") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(num);
  }

  // Fallback for custom symbols like "Rs."
  return `${symbol} ${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function getFirebaseErrorMessage(error) {
  const code = error?.code || "";
  if (code.includes("email-already-in-use")) return "This email is already registered.";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) return "Invalid email or password.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("permission-denied")) return "Firebase permission denied. Check Firestore rules.";
  return error?.message || "Something went wrong. Please try again.";
}
