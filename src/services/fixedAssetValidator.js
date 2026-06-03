/**
 * Fixed Asset Validator — Validates fixed asset data before saving.
 */

export function validateFixedAsset(data) {
  if (!data.name || data.name.trim() === '') return 'Nama aset wajib diisi';
  if (!data.category) return 'Kategori wajib dipilih';
  if (!data.purchasePrice || data.purchasePrice <= 0) return 'Harga beli harus lebih dari 0';
  if (data.currentValue < 0) return 'Nilai saat ini tidak boleh negatif';
  return null;
}
