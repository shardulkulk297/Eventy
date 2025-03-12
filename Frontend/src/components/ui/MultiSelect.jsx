import React, { useState } from "react";
import { cva } from "class-variance-authority";
import {
    CheckIcon,
    XCircle,
    ChevronDown,
    XIcon,
    WandSparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";

// Variants for the multi-select component styling using class-variance-authority
const multiSelectVariants = cva(
    "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
    {
        variants: {
            variant: {
                default:
                    "border-foreground/10 text-foreground bg-card hover:bg-card/80",
                secondary:
                    "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                inverted: "inverted",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const MultiSelect = React.forwardRef((props, ref) => {
    const {
        options,
        onValueChange,
        variant,
        defaultValue = [],
        placeholder = "Select options",
        animation = 0,
        maxCount = 15,
        modalPopover = false,
        asChild = false,
        className,
        ...rest
    } = props;

    const [selectedValues, setSelectedValues] = useState(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleInputKeyDown = (event) => {
        if (event.key === "Enter") {
            setIsPopoverOpen(true);
        } else if (event.key === "Backspace" && !event.currentTarget.value) {
            const newSelectedValues = [...selectedValues];
            newSelectedValues.pop();
            setSelectedValues(newSelectedValues);
            onValueChange(newSelectedValues);
        }
    };

    const toggleOption = (option) => {
        const newSelectedValues = selectedValues.includes(option)
            ? selectedValues.filter((value) => value !== option)
            : [...selectedValues, option];
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
    };

    const handleClear = () => {
        setSelectedValues([]);
        onValueChange([]);
    };

    const handleTogglePopover = () => {
        setIsPopoverOpen((prev) => !prev);
    };

    //   const clearExtraOptions = () => {
    //     const newSelectedValues = selectedValues.slice(0, maxCount);
    //     setSelectedValues(newSelectedValues);
    //     onValueChange(newSelectedValues);
    //   };

    const toggleAll = () => {
        if (selectedValues.length === options.length) {
            handleClear();
        } else {
            const allValues = options.map((option) => option.value);
            setSelectedValues(allValues);
            onValueChange(allValues);
        }
    };

    return (
        <Popover
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            modal={modalPopover}
        >
            <PopoverTrigger asChild>
                <Button
                    ref={ref}
                    {...rest}
                    onClick={handleTogglePopover}
                    className={cn(
                        "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
                        className
                    )}
                >
                    {selectedValues.length > 0 ? (
                        <div className="flex justify-between items-center w-full bg-white text-black max-h-max">
                            {/* Replace flex container with grid for badges */}
                            <div className="grid grid-cols-4 gap-1">
                                {selectedValues.map((value) => {
                                    const option = options.find((o) => o.value === value);
                                    const IconComponent = option && option.icon;
                                    return (
                                        <Badge
                                            key={value}
                                            className={cn(
                                                isAnimating ? "animate-bounce" : "",
                                                multiSelectVariants({ variant })
                                            )}
                                            style={{ animationDuration: `${animation}s` }}
                                        >
                                            {IconComponent && (
                                                <IconComponent className="h-4 w-4 mr-2" />
                                            )}
                                            {option && option.label}
                                            <XCircle
                                                className="ml-2 h-4 w-4 cursor-pointer"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    toggleOption(value);
                                                }}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between">
                                <XIcon
                                    className="h-4 mx-2 cursor-pointer text-muted-foreground"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleClear();
                                    }}
                                />
                                <Separator orientation="vertical" className="flex min-h-6 h-full" />
                                <ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full mx-auto">
                            <span className="text-sm text-muted-foreground mx-3">
                                {placeholder}
                            </span>
                            <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
                        </div>
                    )}

                    {/* pokemon */}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 bg-white text-black"
                align="start"
                onEscapeKeyDown={() => setIsPopoverOpen(false)}
            >
                <Command>
                    <CommandInput
                        placeholder="Search..."
                        onKeyDown={handleInputKeyDown}
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                key="all"
                                onSelect={toggleAll}
                                className="cursor-pointer"
                            >
                                <div
                                    className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        selectedValues.length === options.length
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50 [&_svg]:invisible"
                                    )}
                                >
                                    <CheckIcon className="h-4 w-4" />
                                </div>
                                <span>(Select All)</span>
                            </CommandItem>
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => toggleOption(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <CheckIcon className="h-4 w-4" />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <div className="flex items-center justify-between">
                                {selectedValues.length > 0 && (
                                    <>
                                        <CommandItem
                                            onSelect={handleClear}
                                            className="flex-1 justify-center cursor-pointer"
                                        >
                                            Clear
                                        </CommandItem>
                                        <Separator
                                            orientation="vertical"
                                            className="flex min-h-6 h-full"
                                        />
                                    </>
                                )}
                                <CommandItem
                                    onSelect={() => setIsPopoverOpen(false)}
                                    className="flex-1 justify-center cursor-pointer max-w-full"
                                >
                                    Close
                                </CommandItem>
                            </div>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
            {animation > 0 && selectedValues.length > 0 && (
                <WandSparkles
                    className={cn(
                        "cursor-pointer my-2 text-foreground bg-background w-3 h-3",
                        isAnimating ? "" : "text-muted-foreground"
                    )}
                    onClick={() => setIsAnimating(!isAnimating)}
                />
            )}
        </Popover>
    );
});

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
