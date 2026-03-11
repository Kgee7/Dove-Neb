'use client';

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { currencies } from "@/lib/currencies"

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CurrencySelector({ value, onValueChange, disabled }: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredCurrencies = React.useMemo(() => {
    return currencies.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const selectedCurrency = React.useMemo(() => 
    currencies.find((c) => c.code === value),
  [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10 px-3"
          disabled={disabled}
        >
          {selectedCurrency ? (
            <span className="truncate text-sm">{selectedCurrency.code} - {selectedCurrency.name}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Select currency...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b px-3 bg-background sticky top-0 z-10">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search currency..."
            className="border-0 focus-visible:ring-0 px-0 h-10 rounded-none shadow-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[280px]">
          {filteredCurrencies.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No currency found.</div>
          ) : (
            <div className="p-1">
              {filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors text-left",
                    value === currency.code && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onValueChange(currency.code)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-bold mr-2 w-10 shrink-0">{currency.code}</span>
                  <span className="truncate flex-1">{currency.name}</span>
                  <span className="ml-2 opacity-50 text-[10px] sm:text-xs font-mono">{currency.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
