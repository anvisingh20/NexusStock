import os
import sys
import shutil

# Add parent directory to system path for module imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import HTTPException
from app.database import engine, Base, SessionLocal
from app import crud, models, schemas

def run_tests():
    print("==================================================")
    print("NexusStock Automated Integrity Verification")
    print("==================================================")
    
    # 1. Clean and initialize database
    if os.path.exists("inventory.db"):
        os.remove("inventory.db")
        print("[✓] Removed existing test database file")
        
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("[✓] Initialized fresh SQLite database tables")

    try:
        # 2. Verify Product CRUD & Business Rules
        print("\n--- Testing Product Creation & Constraints ---")
        
        # Test valid product 1
        p1_data = schemas.ProductCreate(
            sku="LAP-MAC-16",
            name="MacBook Pro 16",
            description="Apple M3 Pro, 18GB RAM",
            price=2499.00,
            stock_quantity=10
        )
        p1 = crud.create_product(db, p1_data)
        print(f"[✓] Created Product 1: '{p1.name}' (SKU: {p1.sku}, Stock: {p1.stock_quantity})")
        
        # Test valid product 2
        p2_data = schemas.ProductCreate(
            sku="MOU-MXM-3S",
            name="MX Master 3S",
            description="Logitech Wireless Mouse",
            price=99.99,
            stock_quantity=20
        )
        p2 = crud.create_product(db, p2_data)
        print(f"[✓] Created Product 2: '{p2.name}' (SKU: {p2.sku}, Stock: {p2.stock_quantity})")

        # Test duplicate SKU constraint
        print("[ ] Verifying SKU uniqueness constraint...")
        try:
            crud.create_product(db, p1_data)
            print("[X] ERROR: Created product with duplicate SKU successfully! (Should have failed)")
            assert False, "SKU uniqueness constraint violated"
        except HTTPException as e:
            print(f"[✓] Caught expected duplicate SKU error: {e.detail}")

        # 3. Verify Customer CRUD & Constraints
        print("\n--- Testing Customer Creation & Constraints ---")
        
        # Test valid customer
        c1_data = schemas.CustomerCreate(
            name="Sarah Connor",
            email="sarah.connor@cyberdyne.com",
            phone="555-1984",
            address="Los Angeles, CA"
        )
        c1 = crud.create_customer(db, c1_data)
        print(f"[✓] Created Customer 1: '{c1.name}' (Email: {c1.email})")

        # Test duplicate Email constraint
        print("[ ] Verifying email uniqueness constraint...")
        try:
            crud.create_customer(db, c1_data)
            print("[X] ERROR: Created customer with duplicate email successfully! (Should have failed)")
            assert False, "Email uniqueness constraint violated"
        except HTTPException as e:
            print(f"[✓] Caught expected duplicate email error: {e.detail}")

        # 4. Verify Transactional Order Safety
        print("\n--- Testing Order Placement and Stock Deductions ---")
        
        # Staging an order: 2 MacBooks ($2499.00 * 2) and 3 mice ($99.99 * 3)
        # Expected Total: 4998.00 + 299.97 = 5297.97
        order_data = schemas.OrderCreate(
            customer_id=c1.id,
            items=[
                schemas.OrderItemCreate(product_id=p1.id, quantity=2),
                schemas.OrderItemCreate(product_id=p2.id, quantity=3)
            ]
        )
        
        order = crud.create_order(db, order_data)
        print(f"[✓] Created Order successfully. ID: {order.id}")
        print(f"    Calculated Total: ${order.total_amount} (Expected: 5297.97)")
        assert float(order.total_amount) == 5297.97, "Calculated total price mismatch"
        
        # Verify stock levels updated
        db.refresh(p1)
        db.refresh(p2)
        print(f"[✓] Product 1 Stock: {p1.stock_quantity} (Expected: 8)")
        print(f"[✓] Product 2 Stock: {p2.stock_quantity} (Expected: 17)")
        assert p1.stock_quantity == 8
        assert p2.stock_quantity == 17

        # 5. Verify Transaction Rollback on Insufficient Stock
        print("\n--- Testing Transaction Rollbacks (Insufficient Stock) ---")
        
        # We try to order 9 MacBooks (only 8 left).
        # We also order 1 mouse (available).
        # This order should FAIL because MacBooks are insufficient.
        # Since it is transaction-safe, the entire order must roll back,
        # meaning the mouse stock should NOT decrease!
        bad_order_data = schemas.OrderCreate(
            customer_id=c1.id,
            items=[
                schemas.OrderItemCreate(product_id=p1.id, quantity=9), # Exceeds stock (8)
                schemas.OrderItemCreate(product_id=p2.id, quantity=1)  # Valid (17)
            ]
        )
        
        print("[ ] Attempting invalid stock order...")
        try:
            crud.create_order(db, bad_order_data)
            print("[X] ERROR: Placed order exceeding stock limits successfully! (Should have failed)")
            assert False, "Order exceeding stock should fail"
        except HTTPException as e:
            print(f"[✓] Caught expected stock validation error: {e.detail}")
            
        # Verify database rollback occurred: Mouse stock should still be 17!
        db.refresh(p2)
        print(f"[✓] Product 2 Stock after rollback: {p2.stock_quantity} (Expected: 17)")
        assert p2.stock_quantity == 17, "Rollback failed! Stock was deducted partially."
        print("[✓] Transaction rollback validated. Zero partial state leakage.")

        # 6. Verify Order Cancellation Restocking
        print("\n--- Testing Order Cancellation & Stock Recovery ---")
        
        crud.cancel_order(db, order.id)
        print("[✓] Cancelled the original order successfully")
        
        # Stocks should return to initial: MacBook -> 10, Mouse -> 20
        db.refresh(p1)
        db.refresh(p2)
        print(f"[✓] Product 1 Stock after cancel: {p1.stock_quantity} (Expected: 10)")
        print(f"[✓] Product 2 Stock after cancel: {p2.stock_quantity} (Expected: 20)")
        assert p1.stock_quantity == 10
        assert p2.stock_quantity == 20
        
        print("\n==================================================")
        print("✓ SUCCESS: All system integrity constraints verified!")
        print("==================================================")
        
    finally:
        db.close()
        # Clean up database file after run
        if os.path.exists("inventory.db"):
            os.remove("inventory.db")

if __name__ == "__main__":
    run_tests()
