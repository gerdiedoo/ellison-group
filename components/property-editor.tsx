import type { Property, Profile } from "@/lib/database.types";
import { ActionForm } from "@/components/action-form";
import { Field, Area, Select, Assignment, Check } from "@/lib/admin-fields";
import { saveProperty, deleteProperty } from "@/app/actions/crm";
export function PropertyEditor({
  property: p,
  team,
}: {
  property?: Property;
  team: Profile[];
}) {
  return (
    <>
      <ActionForm
        action={saveProperty}
        label={p ? "Save property" : "Create property"}
      >
        <input type="hidden" name="id" value={p?.id || ""} />
        <div className="two-cols">
          <div>
            <Field
              name="address"
              label="Street address"
              value={p?.address}
              required
            />
            <Field
              name="slug"
              label="URL slug (lowercase words and hyphens)"
              value={p?.slug}
              required
            />
            <Field
              name="location"
              label="City, state and ZIP"
              value={p?.location}
              required
            />
            <Select
              name="neighborhood"
              label="Neighborhood"
              options={[
                "The Heights",
                "Hillcrest",
                "Historic Downtown",
                "Chenal",
                "Maumelle",
                "Pleasant Valley",
                "Beyond Little Rock",
              ]}
              value={p?.neighborhood}
            />
            <Field
              name="property_type"
              label="Property type"
              value={p?.property_type || "Single-family"}
              required
            />
            <Field
              name="price"
              label="Price (USD)"
              type="number"
              value={p?.price || 0}
              required
            />
            <Field
              name="beds"
              label="Bedrooms"
              type="number"
              value={p?.beds || 0}
            />
            <Field
              name="baths"
              label="Bathrooms"
              type="number"
              value={p?.baths || 0}
            />
            <Field
              name="sqft"
              label="Square feet"
              type="number"
              value={p?.sqft || 0}
            />
          </div>
          <div>
            <Area
              name="description"
              label="Description"
              value={p?.description}
              rows={8}
            />
            <Area
              name="features"
              label="Features (one per line)"
              value={p?.features.join("\n")}
            />
            <Select
              name="listing_status"
              label="Listing status"
              options={["For Sale", "Pending", "Sold"]}
              value={p?.listing_status}
            />
            <Assignment team={team} value={p?.assigned_to} />
            <Select
              name="illustration"
              label="Illustration when photography is unavailable"
              options={[
                "stone",
                "stucco",
                "brick",
                "columns",
                "porch",
                "ranch",
                "tower",
                "lot",
              ]}
              value={p?.illustration}
            />
            <Check
              name="published"
              label="Published on the public website"
              checked={p?.published}
            />
            <div className="field">
              <label htmlFor="photos">
                Add property photos (JPEG, PNG, WebP; 10 MB each)
              </label>
              <input
                id="photos"
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
              />
            </div>
            <p className="policy">
              Uploads use the public listing photography bucket. Do not upload
              private documents.
            </p>
          </div>
        </div>
        {!!p?.images.length && (
          <div className="grid">
            {p.images.map((url, i) => (
              <div className="card" key={url}>
                <img
                  src={url}
                  alt={"Listing image " + (i + 1)}
                  style={{
                    width: "100%",
                    aspectRatio: "8/5",
                    objectFit: "cover",
                  }}
                />
                <label className="form-check">
                  <input name="remove_images" type="checkbox" value={url} />
                  Remove this image
                </label>
              </div>
            ))}
          </div>
        )}
      </ActionForm>
      {p && (
        <div className="card" style={{ marginTop: 40 }}>
          <h2>Delete property</h2>
          <p>
            Deletion removes the listing and its stored photos. Existing
            inquiries retain their history.
          </p>
          <ActionForm action={deleteProperty} label="Delete property">
            <input type="hidden" name="id" value={p.id} />
            <Check name="confirm" label="I confirm deletion of this property" />
          </ActionForm>
        </div>
      )}
    </>
  );
}
