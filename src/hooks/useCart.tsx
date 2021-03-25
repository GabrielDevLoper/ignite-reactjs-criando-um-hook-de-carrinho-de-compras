import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;

}

interface CartContextData {
  cart: Product[];
  
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  useEffect(() => {
    async function loadProducts() {
      api.get("/products").then(response => setProducts(response.data))
    }

    async function loadStock(){
      api.get("/stock").then(response => setStock(response.data));

    }
 
    loadStock()
    loadProducts();
  }, []);

  const addProduct = async (productId: number) => {
    try {
      // buscando o produto
      const product = products.filter(product => product.id == productId);

      if(!product){
        toast.error('O produto no qual você esta tentando adicionar não existe');
        return ;
      }

      // verificando se o produto ja foi inserido no carrinho
      const productAlreadyExistsOnCart = cart.find(cart => cart.id == product[0].id);

      // inserindo produto pela segunda vez em diante
      if(productAlreadyExistsOnCart){
        cart.map((productExistsCart) => {
          if(productExistsCart.id == product[0].id){
            // verificando se tem stock disponivel
             stock.map(availableProduct => {
              if(availableProduct.id == productExistsCart.id){
                if(productExistsCart.amount >= availableProduct.amount){
                  toast.error('Quantidade solicitada fora de estoque');
                  return ;
                }else {
                  productExistsCart.amount += 1;
                }
              }
            });
          }
          return productExistsCart;
        }); 

      
        setCart([
          ...cart
        ]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      }else {
        // inserindo produto pela primeira vez no carrinho
        setCart([
          ...cart, 
          {...product[0], amount: 1}
        ]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
    
      cart.map(c => {
        if(c.id == productId){
          cart.splice(cart.indexOf(c), 1);
        }
      });

      setCart([...cart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const product = cart.filter((product) => productId == product.id);

      if(product[0].amount <= 0){
        return ;
      }
      
      cart.map(productOnCart => {
        if(productOnCart.id == product[0].id){
          if(amount >= 1){
            // verificando se tem stock disponivel
            stock.map(availableProduct => {
              if(availableProduct.id == productOnCart.id){
                if(productOnCart.amount >= availableProduct.amount){
                  toast.error('Quantidade solicitada fora de estoque');
                  return ;
                }else {
                  productOnCart.amount += 1;
                  
                }
              }
            });
          }else {
            productOnCart.amount -= 1;
            
          }
        }

        return productOnCart;
      });

      setCart([...cart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
