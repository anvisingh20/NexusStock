from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# --- Order Item Schemas ---
class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")

class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    product_id: str
    quantity: int
    unit_price: Decimal
    product_name: Optional[str] = None # Added for easier UI display

    model_config = ConfigDict(from_attributes=True)

# --- Order Schemas ---
class OrderCreate(BaseModel):
    customer_id: str
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = None # For UI convenience
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)

# --- Product Schemas ---
class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=2, description="SKU must be unique and have at least 2 characters")
    name: str = Field(..., min_length=1, description="Product Name is required")
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, description="Price must be greater than zero")
    stock_quantity: int = Field(..., ge=0, description="Stock quantity cannot be negative")

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(BaseModel):
    id: str
    sku: str
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Customer Schemas ---
class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Customer name is required")
    email: EmailStr = Field(..., description="A valid email is required")
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard Stats Schema ---
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: int
