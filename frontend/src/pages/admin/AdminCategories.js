import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { categoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color_token: 'blue'
  });

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
    { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAllIncludingInactive();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color_token: 'blue'
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
  
    try {
      if (editingCategory) {
        // Update existing category
        await categoriesAPI.update(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        // Create new category
        await categoriesAPI.create(formData);
        toast.success('Category created successfully');
      }
      
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save category';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color_token: category.color_token
    });
    setShowForm(true);
  };

  const handleToggleActive = async (category) => {
    try {
      await categoriesAPI.update(category.id, {
        is_active: !category.is_active
      });
      toast.success(`Category ${!category.is_active ? 'activated' : 'deactivated'} successfully`);
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error('Failed to update category status');
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await categoriesAPI.delete(category.id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete category';
      toast.error(errorMessage);
    }
  };

  const getColorClass = (colorToken) => {
    const color = colorOptions.find(c => c.value === colorToken);
    return color ? color.class : 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="categories-container">
        <div className="categories-bg-animation">
          <div className="categories-bg-circle"></div>
          <div className="categories-bg-circle"></div>
          <div className="categories-bg-circle"></div>
        </div>
        <div className="categories-content">
          <div className="categories-header">
            <h1 className="categories-title">Manage Categories</h1>
            <p className="categories-subtitle">Configure activity categories and their colors</p>
          </div>
          <div className="categories-card">
            <div className="categories-loading">
              <div className="categories-loading-spinner"></div>
              <div className="categories-loading-text">Loading categories...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="categories-bg-animation">
        <div className="categories-bg-circle"></div>
        <div className="categories-bg-circle"></div>
        <div className="categories-bg-circle"></div>
      </div>
      <div className="categories-content">
        <div className="categories-header">
          <div className="categories-header-content">
            <h1 className="categories-title">Manage Categories</h1>
            <p className="categories-subtitle">Configure activity categories and their colors</p>
          </div>
          <div className="categories-actions">
            <button 
              onClick={() => setShowForm(true)}
              className="categories-btn categories-btn-primary"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>
        </div>

        {/* Add/Edit Category Modal */}
        {showForm && (
          <div className="categories-modal-overlay" onClick={resetForm}>
            <div className="categories-modal" onClick={(e) => e.stopPropagation()}>
              <div className="categories-modal-header">
                <h3 className="categories-modal-title">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={resetForm}
                  className="categories-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>
            
              <div className="categories-modal-body">
                <form onSubmit={handleSubmit} className="categories-form">
                  <div className="categories-form-group">
                    <label htmlFor="name" className="categories-form-label">
                      Category Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="categories-form-input"
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  
                  <div className="categories-form-group">
                    <label htmlFor="color_token" className="categories-form-label">
                      Color
                    </label>
                    <div className="categories-color-grid">
                      {colorOptions.map((color) => (
                        <label key={color.value} className="categories-color-option">
                          <input
                            type="radio"
                            name="color_token"
                            value={color.value}
                            checked={formData.color_token === color.value}
                            onChange={handleInputChange}
                            className="categories-color-radio"
                          />
                          <div className={`categories-color-circle ${color.class} ${
                            formData.color_token === color.value ? 'categories-color-selected' : ''
                          }`}></div>
                          <span className="categories-color-label">{color.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="categories-form-actions">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="categories-btn categories-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="categories-btn categories-btn-primary"
                    >
                      <Save size={16} />
                      {editingCategory ? 'Update' : 'Create'} Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="categories-list">
          {categories.map((category) => (
            <div key={category.id} className={`categories-card ${!category.is_active ? 'categories-card-inactive' : ''}`}>
              <div className="categories-item-header">
                <div className="categories-item-info">
                  <div className="categories-item-name">
                    {category.name}
                  </div>
                  <div className="categories-item-color">
                    <div className={`categories-color-preview ${getColorClass(category.color_token)}`}></div>
                    <span className="categories-color-name capitalize">
                      {category.color_token}
                    </span>
                  </div>
                  <div className="categories-item-date">
                    Created: {new Date(category.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="categories-item-actions">
                  <div className="categories-status">
                    <span className={`categories-status-badge ${
                      category.is_active ? 'categories-status-active' : 'categories-status-inactive'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="categories-action-buttons">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`categories-action-btn ${
                        category.is_active 
                          ? 'categories-action-warning' 
                          : 'categories-action-success'
                      }`}
                      title={category.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {category.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="categories-action-btn categories-action-edit"
                      title="Edit category"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="categories-action-btn categories-action-delete"
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="categories-card">
              <div className="categories-empty">
                <Users size={64} className="categories-empty-icon" />
                <h3 className="categories-empty-title">No categories found</h3>
                <p className="categories-empty-text">
                  Get started by creating your first category.
                </p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="categories-btn categories-btn-primary"
                >
          <Plus size={16} />
          Add Category
        </button>
      </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
