
import { motion } from "motion/react";
import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md text-center"
      >
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Construction className="size-7" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This section is connected to the WorkFlow shell and
          will be implemented in the next feature phase.
        </p>
      </motion.div>
    </main>
  );
}

