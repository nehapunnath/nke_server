class Product {
  constructor(productData) {
    this.name = productData.name;
    this.brand = productData.brand;
    this.category = productData.category;
    this.price = productData.price;
    this.modelNo = productData.modelNo;
    this.warranty = productData.warranty;
    this.stockStatus = productData.stockStatus;
    this.description = productData.description;
    this.images = productData.images || [];
    this.specs = productData.specs || [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const errors = [];
    
    if (!this.name) errors.push('Product name is required');
    if (!this.brand) errors.push('Brand is required');
    if (!this.category) errors.push('Category is required');
    if (!this.price) errors.push('Price is required');
    if (!this.modelNo) errors.push('Model number is required');
    if (!this.warranty) errors.push('Warranty information is required');
    if (!this.description) errors.push('Description is required');
    
    return errors;
  }

  toJSON() {
    return {
      name: this.name,
      brand: this.brand,
      category: this.category,
      price: this.price,
      modelNo: this.modelNo,
      warranty: this.warranty,
      stockStatus: this.stockStatus,
      description: this.description,
      images: this.images,
      specs: this.specs,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

class CategoryCatalogue {
  constructor(catalogueData) {
    this.category = catalogueData.category;
    this.catalogue = catalogueData.catalogue || null;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const errors = [];
    
    if (!this.category) errors.push('Category is required');
    if (!this.catalogue) errors.push('Catalogue file is required');
    
    return errors;
  }

  toJSON() {
    return {
      category: this.category,
      catalogue: this.catalogue,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { Product, CategoryCatalogue };