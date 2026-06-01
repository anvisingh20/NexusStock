from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from .database import engine, Base, get_db
from . import crud, schemas, models

# Automatically build database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Backend API for managing products, customers, orders, and stock levels.",
    version="1.0.0"
)

# Enable CORS for frontend compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to serialize an order with customer and product names
def serialize_order(order: models.Order) -> schemas.OrderResponse:
    items_out = []
    for item in order.items:
        items_out.append(schemas.OrderItemResponse(
            id=item.id,
            order_id=item.order_id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=item.product.name if item.product else "Unknown Product"
        ))
    return schemas.OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else "Unknown Customer",
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        items=items_out
    )

# --- Dashboard API ---
@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

# --- Product APIs ---
@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)

@app.get("/products", response_model=List[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: str, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: str, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db, product_id, product_update)

@app.delete("/products/{product_id}", response_model=schemas.ProductResponse)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    return crud.delete_product(db, product_id)


# --- Customer APIs ---
@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, customer)

@app.get("/customers", response_model=List[schemas.CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db, skip=skip, limit=limit)

@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def read_customer(customer_id: str, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.put("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(customer_id: str, customer_update: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    return crud.update_customer(db, customer_id, customer_update)

@app.delete("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    return crud.delete_customer(db, customer_id)


# --- Order APIs ---
@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    new_order = crud.create_order(db, order)
    return serialize_order(new_order)

@app.get("/orders", response_model=List[schemas.OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = crud.get_orders(db, skip=skip, limit=limit)
    return [serialize_order(o) for o in orders]

@app.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def read_order(order_id: str, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(order)

@app.delete("/orders/{order_id}", response_model=schemas.OrderResponse)
def cancel_order(order_id: str, db: Session = Depends(get_db)):
    order = crud.cancel_order(db, order_id)
    return serialize_order(order)
