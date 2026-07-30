export function resolveTimelineMessage(entry) {
  if (!entry) {
    return "";
  }

  switch (entry.key) {
    case "week_passed":
      return "📅 1 hafta geçti.";

    case "player_action_processed":
      return `📜 Emir işlendi: ${entry.data?.text ?? ""}`;

    case "city_under_siege":
      return `🏰 ${formatCityName(entry.data?.city)} kuşatma altına alındı.`;

    default:
      return "Bilinmeyen bir olay gerçekleşti.";
  }
}

function formatCityName(cityId) {
  switch (cityId) {
    case "bursa":
      return "Bursa";

    case "iznik":
      return "İznik";

    case "sogut":
      return "Söğüt";

    case "bilecik":
      return "Bilecik";

    case "konstantinopolis":
      return "Konstantinopolis";

    default:
      return cityId ?? "Bilinmeyen şehir";
  }
}