export function formatAssistanceDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function assistanceStatusClass(status: string) {
  switch (status) {
    case "Resolved":
    case "Closed":
      return "bg-emerald-50 text-emerald-700";
    case "In Progress":
    case "Under Review":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-teal-50 text-teal-700";
  }
}

export function assistancePriorityClass(priority: string) {
  switch (priority) {
    case "Urgent":
      return "bg-red-50 text-red-700";
    case "High":
      return "bg-amber-50 text-amber-700";
    case "Low":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-teal-50 text-teal-700";
  }
}
