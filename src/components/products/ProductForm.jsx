import { useEffect, useMemo, useState } from "react";
import { useHotels } from "../../hooks/useHotels";
import { uploadFile } from "../../services/storageService";
import { DEFAULT_PRODUCT_IMAGE, PRODUCT_CATEGORIES } from "../../utils/constants";
import { validateProduct } from "../../utils/validators";

const initialValues = {
  name: "",
  hotelName: "",
  category: PRODUCT_CATEGORIES[0],
  price: "",
  rating: "4.5",
  imageUrl: DEFAULT_PRODUCT_IMAGE,
  description: "",
  available: true
};

export default function ProductForm({ editingProduct, onCancel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setValues(editingProduct ? { ...initialValues, ...editingProduct } : initialValues);
    setImageFile(null);
    setUploadError("");
  }, [editingProduct]);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateProduct(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setUploadError("");

    const nextValues = { ...values };
    if (imageFile) {
      try {
        nextValues.imageUrl = await uploadFile(imageFile, "products");
      } catch (err) {
        setUploadError("Failed to upload image. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    await onSubmit(nextValues);
    setSubmitting(false);
    if (!editingProduct) setValues(initialValues);
  }

  const { hotels, loading: hotelsLoading, error: hotelsError } = useHotels();

  const hotelSelectOptions = useMemo(() => {
    const options = [...hotels];
    if (values.hotelName && !hotels.some((hotel) => hotel.name === values.hotelName)) {
      options.unshift({ id: "current", name: values.hotelName });
    }
    return options;
  }, [hotels, values.hotelName]);

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editingProduct ? "Edit product" : "Add product"}</h2>
        <p className="mt-1 text-sm text-slate-500">Create menu items that customers can add to cart.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Product name
          <input className="input" onChange={(event) => setValues({ ...values, name: event.target.value })} value={values.name} />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
        <label className="field-label">
          Hotel name
          <select
            className="input"
            disabled={hotelsLoading || hotels.length === 0}
            onChange={(event) => setValues({ ...values, hotelName: event.target.value })}
            value={values.hotelName}
          >
            <option value="" disabled>
              {hotelsLoading ? "Loading hotels..." : hotels.length ? "Select a hotel" : "No hotels available"}
            </option>
            {hotelSelectOptions.map((hotel) => (
              <option key={hotel.id} value={hotel.name}>
                {hotel.name}
              </option>
            ))}
          </select>
          {errors.hotelName ? <span className="field-error">{errors.hotelName}</span> : null}
          {hotelsError ? <span className="field-error">{hotelsError}</span> : null}
        </label>
        <label className="field-label">
          Category
          <select className="input" onChange={(event) => setValues({ ...values, category: event.target.value })} value={values.category}>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Price
          <input className="input" min="1" onChange={(event) => setValues({ ...values, price: event.target.value })} type="number" value={values.price} />
          {errors.price ? <span className="field-error">{errors.price}</span> : null}
        </label>
        <label className="field-label">
          Rating
          <input className="input" max="5" min="1" onChange={(event) => setValues({ ...values, rating: event.target.value })} step="0.1" type="number" value={values.rating} />
        </label>
        <label className="field-label">
          Product image
          <input
            className="input"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            type="file"
            accept="image/*"
          />
          <p className="text-xs text-slate-500">Upload an image file to store in Firebase Storage, or keep the existing URL.</p>
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
        <input checked={values.available} className="h-4 w-4 accent-ember" onChange={(event) => setValues({ ...values, available: event.target.checked })} type="checkbox" />
        Available for ordering
      </label>
      <div className="flex flex-wrap justify-end gap-3">
        {editingProduct ? (
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving..." : editingProduct ? "Update product" : "Add product"}
        </button>
      </div>
    </form>
  );
}
