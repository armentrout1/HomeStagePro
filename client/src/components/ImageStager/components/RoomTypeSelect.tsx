import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { roomTypes } from "../constants";

interface RoomTypeSelectProps {
  roomType: string;
  onRoomTypeChange: (value: string) => void;
}

export function RoomTypeSelect({ roomType, onRoomTypeChange }: RoomTypeSelectProps) {
  return (
    <div className="mb-6">
      <div className="mx-auto max-w-xs md:max-w-4xl md:mx-0">
        <Label
          htmlFor="room-type"
          className="block mb-2 text-center md:text-left"
        >
          Select Room Type
        </Label>
        <Select value={roomType} onValueChange={onRoomTypeChange}>
          <SelectTrigger
            id="room-type"
            className="pp-control mx-auto max-w-xs w-full md:max-w-none md:mx-0 h-12 px-5 text-base"
          >
            <SelectValue placeholder="Select Room Type" />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
