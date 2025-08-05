function getLocaleSlug(locale) {
  switch (locale) {
    case 'en_gb':
    case 'bg_bg':
      return 'customer-service';
    // Add more cases as needed
    default:
      return 'customer-service'; // fallback
  }
}

module.exports = getLocaleSlug;
