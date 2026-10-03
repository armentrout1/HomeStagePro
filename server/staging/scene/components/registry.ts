import { z } from "zod";
import { idSchema, elementClassSchema } from "../../../../shared/staging/scene-map";
import { reject } from "../errors";
import { isRealImplementation, realRegistrationMatches } from "./real";
import { isRegisteredImplementation } from "./fake";
import { freeze, policySchema, taskSchema, type VisionComponent, type Task } from "./types";
const registrationSchema = z.object({
    id: idSchema, version: z.string().regex(/^[A-Za-z0-9_.-]{1,128}$/), task: taskSchema,
    execution: z.literal("local"), supportedClasses: z.array(elementClassSchema).max(18),
    dependencies: z.array(taskSchema).max(5), policy: policySchema,
    licenseId: idSchema, codeRevision: z.string().regex(/^[a-f0-9]{40}$/),
}).strict();
export type Registration = z.infer<typeof registrationSchema> & {
    component: VisionComponent;
};
export class ComponentRegistry {
    private entries = new Map<string, Registration>();
    register(value: z.input<typeof registrationSchema>, component: VisionComponent): void {
        const parsed = registrationSchema.safeParse(value);
        if (!parsed.success)
            reject("COMPONENT_NOT_REGISTERED");
        const v = parsed.data, key = `${v.id}@${v.version}`;
        if (this.entries.has(key) || (!isRegisteredImplementation(component) && !isRealImplementation(component)) || component.execution !== "local" || component.id !== v.id || component.version !== v.version)
            reject("COMPONENT_NOT_REGISTERED");
        if (isRealImplementation(component) ? !realRegistrationMatches(v, component) : v.policy.backend !== "synthetic-subprocess-v1")
            reject("COMPONENT_NOT_REGISTERED");
        if (component.task !== v.task || v.policy.task !== v.task)
            reject("COMPONENT_TASK_MISMATCH");
        if (new Set(v.dependencies).size !== v.dependencies.length || v.dependencies.includes(v.task))
            reject("COMPONENT_DEPENDENCY_INVALID");
        if (new Set(v.supportedClasses).size !== v.supportedClasses.length || JSON.stringify(component.supportedClasses) !== JSON.stringify(v.supportedClasses))
            reject("COMPONENT_NOT_REGISTERED");
        const entry = freeze({ ...v, component });
        // Conservative task-level graph: multiple adapters cannot introduce ambiguous task cycles.
        const all = [...Array.from(this.entries.values()), entry];
        const walk = (task: Task, path: Task[]) => {
            if (path.includes(task))
                reject("COMPONENT_DEPENDENCY_INVALID");
            for (const item of all.filter(e => e.task === task))
                for (const dependency of item.dependencies)
                    walk(dependency, [...path, task]);
        };
        for (const item of all)
            walk(item.task, []);
        this.entries.set(key, entry);
    }
    get(id: string, version: string, task: Task): Registration {
        const entry = this.entries.get(`${id}@${version}`);
        if (!entry)
            reject("COMPONENT_NOT_REGISTERED");
        if (entry.task !== task)
            reject("COMPONENT_TASK_MISMATCH");
        return entry;
    }
}
