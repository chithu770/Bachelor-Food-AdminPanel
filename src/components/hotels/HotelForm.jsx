import { useEffect, useState } from "react";
import { uploadFile } from "../../services/storageService";
import { DEFAULT_HOTEL_IMAGE, HOTEL_TYPES } from "../../utils/constants";
import { validateHotel } from "../../utils/validators";

const initialValues = {
  name: "",
  type: HOTEL_TYPES[0],
  location: "",
  phone: "",
  rating: "4.5",
  imageUrl: DEFAULT_HOTEL_IMAGE,
  description: "",
  open: true
};

export default function HotelForm({ editingHotel, onCancel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setValues(editingHotel ? { ...initialValues, ...editingHotel } : initialValues);
    setImageFile(null);
    setUploadError("");
  }, [editingHotel]);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateHotel(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    setUploadError("");

    const nextValues = { ...values };
    if (imageFile) {
      try {
        nextValues.imageUrl = await uploadFile(imageFile, "hotels");
      } catch (err) {
        setUploadError("Failed to upload image. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    await onSubmit(nextValues);
    setSubmitting(false);
    if (!editingHotel) setValues(initialValues);
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editingHotel ? "Edit hotel" : "Add hotel"}</h2>
        <p className="mt-1 text-sm text-slate-500">Manage kitchen partners, mess providers, and bachelor-friendly stays.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Hotel name
          <input className="input" onChange={(event) => setValues({ ...values, name: event.target.value })} value={values.name} />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
        <label className="field-label">
          Type
          <select className="input" onChange={(event) => setValues({ ...values, type: event.target.value })} value={values.type}>
            {HOTEL_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Location
          <input className="input" onChange={(event) => setValues({ ...values, location: event.target.value })} value={values.location} />
          {errors.location ? <span className="field-error">{errors.location}</span> : null}
        </label>
        <label className="field-label">
          Phone
          <input className="input" onChange={(event) => setValues({ ...values, phone: event.target.value })} value={values.phone} />
          {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
        </label>
        <label className="field-label">
          Rating
          <input className="input" max="5" min="1" onChange={(event) => setValues({ ...values, rating: event.target.value })} step="0.1" type="number" value={values.rating} />
        </label>
        <label className="field-label">
          Hotel image
          <input
            className="input"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            type="file"
            accept="image/*"
          />
          <p className="text-xs text-slate-500">Upload an image file to store in Firebase Storage, or use an existing URL.</p>
        </label>
        <label className="field-label">
          Image URL
          <input className="input" onChange={(event) => setValues({ ...values, imageUrl: event.target.value })} value={values.imageUrl} />
        </label>
      </div>
      {uploadError ? <div className="field-error">{uploadError}</div> : null}
      <label className="field-label">
        Description
        <textarea className="input min-h-24 resize-y" onChange={(event) => setValues({ ...values, description: event.target.value })} value={values.description} />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
        <input checked={values.open} className="h-4 w-4 accent-ember" onChange={(event) => setValues({ ...values, open: event.target.checked })} type="checkbox" />
        Open for orders
      </label>
      <div className="flex flex-wrap justify-end gap-3">
        {editingHotel ? (
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving..." : editingHotel ? "Update hotel" : "Add hotel"}
        </button>
      </div>
    </form>
  );
}
