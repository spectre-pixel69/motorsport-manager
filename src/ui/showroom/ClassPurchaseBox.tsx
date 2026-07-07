// Class Purchase Box - Individual class selection and quantity picker

interface Props {
  classType: string;
  className: string;
  leasePrice: number;
  itemId?: string;
  engineId?: string;
  selected: boolean;
  quantity: number;
  onUpdate: (quantity: number, selected: boolean) => void;
}

export function ClassPurchaseBox({
  classType,
  className,
  leasePrice,
  engineId,
  selected,
  quantity,
  onUpdate,
}: Props) {
  const totalCost = leasePrice * quantity;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(2, quantity + delta));
    onUpdate(newQuantity, selected);
  };

  return (
    <div class={`purchase-box ${selected ? 'selected' : ''}`}>
      <div class="purchase-header">
        <div class="class-info">
          <h4>{className}</h4>
          <span class="lease-cost">Lease: ${leasePrice.toLocaleString()}/yr</span>
        </div>

        <input
          type="checkbox"
          class="purchase-checkbox"
          checked={selected}
          onChange={(e) => onUpdate(quantity, (e.target as HTMLInputElement).checked)}
          title="Select this class"
        />
      </div>

      {selected && (
        <div class="purchase-details">
          <div class="quantity-selector">
            <span class="label">Quantity (bikes):</span>
            <div class="qty-control">
              <button class="qty-btn" onClick={() => handleQuantityChange(-1)}>−</button>
              <span class="qty-value">{quantity}</span>
              <button class="qty-btn" onClick={() => handleQuantityChange(1)}>+</button>
            </div>
          </div>

          <div class="cost-summary">
            <span class="cost-label">Total for this class:</span>
            <span class="cost-value">${totalCost.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
