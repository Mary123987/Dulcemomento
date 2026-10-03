/** Contratos para una futura API. Los datos de tarjetas nunca forman parte de estos modelos. */
export interface CartItem {productId:string;size:string;flavor:string;decoration:string;message:string;occasion:string;quantity:number;key:string}
export interface Cart {items:CartItem[];coupon:string}
export interface Coupon {code:string;rate:number}
export interface Customer {name:string;dni:string;email:string;phone:string}
export interface Delivery {district:string|null;address:string|null;reference:string}
export interface Payment {status:'pending'|'simulated'|'confirmed'|'failed';provider:string|null}
export interface OrderItem extends CartItem {unitPrice:number}
export interface Order {orderId:string;customer:Customer;products:OrderItem[];subtotal:number;discount:number;deliveryCost:number;total:number;coupon:string;deliveryMethod:'Recojo'|'Delivery';delivery:Delivery;paymentMethod:'Tarjeta'|'Yape'|'Pago al recoger';payment:Payment;deliveryDate:string;status:'Pedido recibido'|'Pago confirmado'|'En preparación'|'Listo'|'En camino'|'Entregado';createdAt:string;isDemo:boolean}
