import React, { useState, useRef } from 'react';

const defaultFormData = {
  title: '',
  description: '',
  category: 'Dinner',
  cookTime: '',
  servings: '',
  difficulty: 'Easy',
  ingredients: [''],
  steps: [''],
  tags: '',
};

const RecipeForm = ({ onSubmit, initialData = defaultFormData, loading = false }) => {
  const [formData, setFormData] = useState(initialData);
  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [existingImage, setExistingImage] = useState(initialData.image || '');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setExistingImage('');
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIngredientChange = (index, value) => {
    const arr = [...formData.ingredients];
    arr[index] = value;
    setFormData((prev) => ({ ...prev, ingredients: arr }));
  };
  const addIngredient    = () => setFormData((prev) => ({ ...prev, ingredients: [...prev.ingredients, ''] }));
  const removeIngredient = (index) => setFormData((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));

  const handleStepChange = (index, value) => {
    const arr = [...formData.steps];
    arr[index] = value;
    setFormData((prev) => ({ ...prev, steps: arr }));
  };
  const addStep    = () => setFormData((prev) => ({ ...prev, steps: [...prev.steps, ''] }));
  const removeStep = (index) => setFormData((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));

  const handleSubmit = (e) => {
    e.preventDefault();

    const ingredients = formData.ingredients.map(i => i.trim()).filter(Boolean);
    const steps       = formData.steps.map(s => s.trim()).filter(Boolean);
    const tags        = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

    const data = new FormData();
    data.append('title',        formData.title);
    data.append('description',  formData.description);
    data.append('category',     formData.category);
    data.append('cookTime',     formData.cookTime);
    data.append('servings',     formData.servings);
    data.append('difficulty',   formData.difficulty);

    // Send arrays as JSON strings — easiest to parse on backend
    data.append('ingredients',  JSON.stringify(ingredients));
    data.append('steps',        JSON.stringify(steps));
    data.append('tags',         JSON.stringify(tags));

    if (imageFile) {
      data.append('image', imageFile);
    } else if (existingImage) {
      data.append('existingImage', existingImage);
    }

    onSubmit(data);
  };

  const displayImage = imagePreview || (existingImage ? `http://localhost:5000${existingImage}` : null);

  return (
    <form onSubmit={handleSubmit}>

      {/* ---- Section 1: Basic Info ---- */}
      <div className="recipe-form-card">
        <h5 className="d-flex align-items-center gap-2">
          <i className="bi bi-info-circle-fill text-danger"></i>
          Basic Information
        </h5>

        <div className="mb-3">
          <label className="form-label fw-semibold">Recipe Title <span className="text-danger">*</span></label>
          <input type="text" className="form-control" name="title" value={formData.title}
            onChange={handleChange} placeholder="e.g. Spaghetti Carbonara" required />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Description <span className="text-danger">*</span></label>
          <textarea className="form-control" name="description" value={formData.description}
            onChange={handleChange} placeholder="Write a short, appetizing description..." rows="3" required />
        </div>

        {/* Image upload */}
        <div className="mb-3">
          <label className="form-label fw-semibold d-flex align-items-center gap-1">
            <i className="bi bi-image text-muted"></i> Recipe Image
          </label>
          <input ref={fileInputRef} type="file" accept="image/*" className="d-none"
            id="recipeImageInput" onChange={handleImageChange} />

          {displayImage ? (
            <div>
              <img src={displayImage} alt="Preview"
                style={{ width: '100%', maxWidth: 320, height: 200, objectFit: 'cover',
                  borderRadius: 10, display: 'block', border: '2px solid #dee2e6' }} />
              <div className="d-flex gap-2 mt-2">
                <label htmlFor="recipeImageInput"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  style={{ cursor: 'pointer' }}>
                  <i className="bi bi-arrow-repeat"></i> Change
                </label>
                <button type="button"
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={handleRemoveImage}>
                  <i className="bi bi-trash3"></i> Remove
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="recipeImageInput"
              className="d-flex flex-column align-items-center justify-content-center gap-2 p-4 rounded"
              style={{ border: '2px dashed #dee2e6', cursor: 'pointer', background: '#fafafa' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#dc3545'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#dee2e6'}>
              <i className="bi bi-cloud-upload fs-2 text-muted"></i>
              <span className="fw-semibold text-muted">Click to upload an image</span>
              <small className="text-muted">PNG, JPG, WEBP up to 5 MB</small>
            </label>
          )}
        </div>
      </div>

      {/* ---- Section 2: Recipe Details ---- */}
      <div className="recipe-form-card">
        <h5 className="d-flex align-items-center gap-2">
          <i className="bi bi-gear-fill text-danger"></i> Recipe Details
        </h5>
        <div className="row g-3">
          <div className="col-md-3 col-6">
            <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
            <select className="form-select" name="category" value={formData.category} onChange={handleChange}>
              {['Breakfast','Lunch','Dinner','Snack','Dessert','Drink'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-3 col-6">
            <label className="form-label fw-semibold">Difficulty</label>
            <select className="form-select" name="difficulty" value={formData.difficulty} onChange={handleChange}>
              {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="col-md-3 col-6">
            <label className="form-label fw-semibold d-flex align-items-center gap-1">
              <i className="bi bi-clock text-muted"></i> Cook Time (min) <span className="text-danger">*</span>
            </label>
            <input type="number" className="form-control" name="cookTime" value={formData.cookTime}
              onChange={handleChange} placeholder="30" min="1" required />
          </div>
          <div className="col-md-3 col-6">
            <label className="form-label fw-semibold d-flex align-items-center gap-1">
              <i className="bi bi-people text-muted"></i> Servings <span className="text-danger">*</span>
            </label>
            <input type="number" className="form-control" name="servings" value={formData.servings}
              onChange={handleChange} placeholder="4" min="1" required />
          </div>
        </div>
      </div>

      {/* ---- Section 3: Ingredients ---- */}
      <div className="recipe-form-card">
        <h5 className="d-flex align-items-center gap-2">
          <i className="bi bi-basket-fill text-danger"></i> Ingredients
        </h5>
        {formData.ingredients.map((ingredient, index) => (
          <div key={index} className="dynamic-field-row">
            <span className="field-index">{index + 1}</span>
            <input type="text" className="form-control" value={ingredient}
              onChange={(e) => handleIngredientChange(index, e.target.value)}
              placeholder="e.g. 2 cups flour" />
            {formData.ingredients.length > 1 && (
              <button type="button" className="btn btn-outline-danger btn-sm d-flex align-items-center"
                onClick={() => removeIngredient(index)}>
                <i className="bi bi-trash3"></i>
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addIngredient}
          className="btn btn-outline-danger w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
          style={{ borderStyle: 'dashed' }}>
          <i className="bi bi-plus-circle"></i> Add Ingredient
        </button>
      </div>

      {/* ---- Section 4: Steps ---- */}
      <div className="recipe-form-card">
        <h5 className="d-flex align-items-center gap-2">
          <i className="bi bi-list-check text-danger"></i> Cooking Steps
        </h5>
        {formData.steps.map((step, index) => (
          <div key={index} className="dynamic-field-row">
            <span className="field-index">{index + 1}</span>
            <textarea className="form-control" value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              placeholder="Describe this cooking step..." rows="2" />
            {formData.steps.length > 1 && (
              <button type="button" className="btn btn-outline-danger btn-sm d-flex align-items-center"
                onClick={() => removeStep(index)}>
                <i className="bi bi-trash3"></i>
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addStep}
          className="btn btn-outline-danger w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
          style={{ borderStyle: 'dashed' }}>
          <i className="bi bi-plus-circle"></i> Add Step
        </button>
      </div>

      {/* ---- Section 5: Tags ---- */}
      <div className="recipe-form-card">
        <h5 className="d-flex align-items-center gap-2">
          <i className="bi bi-tags-fill text-danger"></i> Tags
        </h5>
        <input type="text" className="form-control" name="tags" value={formData.tags}
          onChange={handleChange} placeholder="e.g. vegetarian, quick, spicy (comma separated)" />
        <small className="text-muted"><i className="bi bi-lightbulb me-1"></i>Separate tags with commas</small>
      </div>

      {/* Submit */}
      <button type="submit"
        className="btn btn-brand w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-4"
        disabled={loading}>
        {loading ? (
          <><span className="spinner-border spinner-border-sm" role="status"></span> Saving Recipe...</>
        ) : (
          <><i className="bi bi-floppy2-fill"></i> Save Recipe</>
        )}
      </button>
    </form>
  );
};

export default RecipeForm;