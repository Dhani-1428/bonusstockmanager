"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Sale, Shop, Product } from "@/lib/types"
import { Printer, Download, X } from "lucide-react"
import { format } from "date-fns"

interface ReceiptPrinterProps {
  sale: Sale | null
  shop: Shop | null
  products: Product[]
  open: boolean
  onClose: () => void
}

export function ReceiptPrinter({ sale, shop, products, open, onClose }: ReceiptPrinterProps) {
  if (!sale || !shop) return null

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || "Unknown Product"
  }

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content")
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.receiptNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 300px;
              margin: 0 auto;
              padding: 20px;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .shop-name { font-size: 16px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            @media print {
              body { width: 100%; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }

  const handleDownload = () => {
    const content = `
RECEIPT
${shop.name}
${shop.address || ""}
${shop.phone || ""}

Receipt #: ${sale.receiptNumber}
Date: ${format(new Date(sale.createdAt), "PPP p")}
${sale.customerName ? `Customer: ${sale.customerName}` : ""}
${sale.customerPhone ? `Phone: ${sale.customerPhone}` : ""}
${sale.customerAddress ? `Address: ${sale.customerAddress}` : ""}

----------------------------------------
ITEMS
----------------------------------------
${sale.items.map(item => {
  const imei = item.imeiNumber || (item.imeiNumbers && item.imeiNumbers.length > 0 ? item.imeiNumbers[0] : null)
  const discount = item.discount || 0
  const totalPrice = item.totalPrice || item.total
  return `${getProductName(item.productId)} x${item.quantity}
  ${imei ? `IMEI: ${imei}` : ""}
  Unit: $${item.unitPrice.toFixed(2)}${discount > 0 ? ` | Disc: $${discount.toFixed(2)}` : ""}
  Total: $${totalPrice.toFixed(2)}`
}).join("\n\n")}

----------------------------------------
Subtotal: $${sale.subtotal.toFixed(2)}
Discount: -$${sale.discountAmount.toFixed(2)}
Tax: $${sale.taxAmount.toFixed(2)}
----------------------------------------
TOTAL: $${sale.totalAmount.toFixed(2)}
Paid: $${sale.paidAmount.toFixed(2)}
${sale.dueAmount > 0 ? `Due: $${sale.dueAmount.toFixed(2)}` : ""}

Payment: ${sale.paymentMethod.toUpperCase()}
Status: ${sale.paymentStatus.toUpperCase()}

----------------------------------------
Thank you for your purchase!
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${sale.receiptNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="bg-card p-4 rounded-lg border font-mono text-sm">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg">{shop.name}</h2>
            {shop.address && <p className="text-muted-foreground text-xs">{shop.address}</p>}
            {shop.phone && <p className="text-muted-foreground text-xs">{shop.phone}</p>}
          </div>

          <Separator className="my-3" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span>{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(sale.createdAt), "PPP p")}</span>
            </div>
            {sale.customerName && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{sale.customerName}</span>
              </div>
            )}
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
            {sale.customerAddress && (
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="text-right max-w-[150px]">{sale.customerAddress}</span>
              </div>
            )}
          </div>

          <Separator className="my-3" />

          <div className="space-y-2">
            {sale.items.map((item, index) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between font-medium">
                  <span>{getProductName(item.productId)}</span>
                  <span>${(item.totalPrice || item.total).toFixed(2)}</span>
                </div>
                <div className="text-muted-foreground ml-2">
                  {item.quantity} x ${item.unitPrice.toFixed(2)}
                  {(item.discount || 0) > 0 && ` (-$${(item.discount || 0).toFixed(2)})`}
                </div>
                {(item.imeiNumber || (item.imeiNumbers && item.imeiNumbers.length > 0)) && (
                  <div className="text-muted-foreground ml-2 text-[10px]">
                    IMEI: {item.imeiNumber || (item.imeiNumbers && item.imeiNumbers[0])}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount:</span>
                <span>-${sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${sale.taxAmount.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL:</span>
              <span>${sale.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid:</span>
              <span>${sale.paidAmount.toFixed(2)}</span>
            </div>
            {sale.dueAmount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Due:</span>
                <span>${sale.dueAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Separator className="my-3" />

          <div className="text-center text-xs text-muted-foreground">
            <p>Payment: {sale.paymentMethod.toUpperCase()}</p>
            <p className="mt-2">Thank you for your purchase!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
