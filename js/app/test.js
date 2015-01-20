define(["cart"], function(cart) {
        //return an object to define the "my/shirt" module.
        return {
            color: "blue",
            size: "large",
            addToCart: function() {
                cart.add(this);
                
                return 5;
            }
        }
    }
);
