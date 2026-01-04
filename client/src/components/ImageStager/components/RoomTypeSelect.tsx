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
      <Label htmlFor="room-type" className="block mb-2 text-center">Select Room Type</Label>
      <Select value={roomType} onValueChange={onRoomTypeChange}>
        <SelectTrigger id="room-type" className="max-w-xs mx-auto">
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
  );
}
