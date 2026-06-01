from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from decimal import Decimal
from . import models, schemas

# --- Product CRUD ---
def get_product(db: Session, product_id: str):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Enforce SKU uniqueness
    db_product = get_product_by_sku(db, product.sku)
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SKU '{product.sku}' already exists"
        )
    
    new_product = models.Product(
        sku=product.sku,
        name=product.name,
        description=product.description,
        price=product.price,
        stock_quantity=product.stock_quantity
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: str, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        # Check SKU uniqueness if it's changing
        existing = get_product_by_sku(db, update_data["sku"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SKU '{update_data['sku']}' is already in use by another product"
            )
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: str):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    db.delete(db_product)
    db.commit()
    return db_product


# --- Customer CRUD ---
def get_customer(db: Session, customer_id: str):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Enforce Email uniqueness
    db_customer = get_customer_by_email(db, customer.email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists"
        )
        
    new_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def update_customer(db: Session, customer_id: str, customer_update: schemas.CustomerUpdate):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    update_data = customer_update.model_dump(exclude_unset=True)
    
    if "email" in update_data and update_data["email"] != db_customer.email:
        # Check email uniqueness
        existing = get_customer_by_email(db, update_data["email"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{update_data['email']}' is already in use by another customer"
            )
            
    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: str):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- Order CRUD ---
def get_order(db: Session, order_id: str):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # Verify Customer
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )
        
    # Start transaction (handled cleanly by FastAPI depends or manual block)
    # Validate stock levels and create entities
    db_items = []
    total_amount = Decimal("0.00")
    
    # Store temporary stock adjustments to avoid double updating if validation fails
    products_to_update = []
    
    for item in order_data.items:
        product = get_product(db, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{item.product_id}' not found"
            )
            
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}'. Requested: {item.quantity}, Available: {product.stock_quantity}"
            )
            
        # Record product update and create item
        product.stock_quantity -= item.quantity
        products_to_update.append(product)
        
        item_total = product.price * item.quantity
        total_amount += item_total
        
        db_item = models.OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price
        )
        db_items.append(db_item)
        
    # Create Order
    new_order = models.Order(
        customer_id=customer.id,
        total_amount=total_amount,
        status="Completed" # Auto-completed after stock validation & order placement
    )
    db.add(new_order)
    db.flush() # Gain order ID
    
    # Relate items to the order
    for db_item in db_items:
        db_item.order_id = new_order.id
        db.add(db_item)
        
    db.commit()
    db.refresh(new_order)
    return new_order

def cancel_order(db: Session, order_id: str):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    if order.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled"
        )
        
    # Return stock back to products
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity
            
    order.status = "Cancelled"
    db.commit()
    db.refresh(order)
    return order


# --- Dashboard Stats ---
def get_dashboard_stats(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Low stock threshold is 10 units (or less)
    low_stock_products = db.query(models.Product).filter(models.Product.stock_quantity <= 10).count()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }
