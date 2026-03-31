"use client";

import { FormField } from "@/components/form/form-field";
import { FormGroup } from "@/components/form/form-group";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const industryOptions = [
  { value: "power", label: "\u7535\u529b" },
  { value: "steel", label: "\u94a2\u94c1" },
  { value: "chemical", label: "\u5316\u5de5" },
  { value: "building-materials", label: "\u5efa\u6750" },
  { value: "textile", label: "\u7eba\u7ec7" },
  { value: "paper", label: "\u9020\u7eb8" },
  { value: "food", label: "\u98df\u54c1" },
  { value: "other", label: "\u5176\u4ed6" },
];

const energyTypeOptions = [
  { value: "coal", label: "\u7164\u70ad" },
  { value: "natural-gas", label: "\u5929\u7136\u6c14" },
  { value: "electricity", label: "\u7535\u529b" },
  { value: "oil", label: "\u77f3\u6cb9" },
  { value: "heat", label: "\u70ed\u529b" },
  { value: "renewable", label: "\u53ef\u518d\u751f\u80fd\u6e90" },
];

export default function EnterpriseConfigPage() {
  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          {"\u4f01\u4e1a\u914d\u7f6e"}
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          {"\u7ba1\u7406\u4f01\u4e1a\u57fa\u672c\u4fe1\u606f\u3001\u8054\u7cfb\u4eba\u3001\u7528\u80fd\u8bbe\u5907\u7b49\u914d\u7f6e"}
        </p>
      </div>

      <FormGroup
        title={"\u4f01\u4e1a\u57fa\u672c\u4fe1\u606f"}
        description={"\u4f01\u4e1a\u6ce8\u518c\u4fe1\u606f\u548c\u57fa\u672c\u8d44\u6599"}
        completionStatus="incomplete"
        defaultOpen={true}
      >
        <div className="space-y-4">
          <FormField label={"\u4f01\u4e1a\u540d\u79f0"} required>
            <Input placeholder={"\u8bf7\u8f93\u5165\u4f01\u4e1a\u5168\u79f0"} />
          </FormField>
          <FormField label={"\u7edf\u4e00\u793e\u4f1a\u4fe1\u7528\u4ee3\u7801"} required>
            <Input placeholder={"\u8bf7\u8f93\u516518\u4f4d\u7edf\u4e00\u793e\u4f1a\u4fe1\u7528\u4ee3\u7801"} />
          </FormField>
          <FormField label={"\u6240\u5c5e\u884c\u4e1a"} required>
            <Select
              options={industryOptions}
              placeholder={"\u8bf7\u9009\u62e9\u6240\u5c5e\u884c\u4e1a"}
            />
          </FormField>
          <FormField label={"\u6cd5\u5b9a\u4ee3\u8868\u4eba"}>
            <Input placeholder={"\u8bf7\u8f93\u5165\u6cd5\u5b9a\u4ee3\u8868\u4eba\u59d3\u540d"} />
          </FormField>
          <FormField label={"\u6ce8\u518c\u5730\u5740"}>
            <Input placeholder={"\u8bf7\u8f93\u5165\u4f01\u4e1a\u6ce8\u518c\u5730\u5740"} />
          </FormField>
          <FormField label={"\u8054\u7cfb\u7535\u8bdd"}>
            <Input placeholder={"\u8bf7\u8f93\u5165\u8054\u7cfb\u7535\u8bdd"} />
          </FormField>
        </div>
      </FormGroup>

      <FormGroup
        title={"\u80fd\u6e90\u914d\u7f6e"}
        description={"\u4f01\u4e1a\u4e3b\u8981\u7528\u80fd\u7c7b\u578b\u53ca\u80fd\u6e90\u6d88\u8d39\u7ed3\u6784"}
        completionStatus="incomplete"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <FormField label={"\u4e3b\u8981\u80fd\u6e90\u7c7b\u578b"} required>
            <Select
              options={energyTypeOptions}
              placeholder={"\u8bf7\u9009\u62e9\u4e3b\u8981\u80fd\u6e90\u7c7b\u578b"}
            />
          </FormField>
          <FormField label={"\u5e74\u5ea6\u603b\u80fd\u8017"} suffix="tce" required>
            <Input type="number" placeholder={"\u8bf7\u8f93\u5165\u5e74\u5ea6\u603b\u80fd\u8017"} />
          </FormField>
          <FormField label={"\u5355\u4f4d\u4ea7\u54c1\u7efc\u5408\u80fd\u8017"} suffix="tce/\u4e07\u5143">
            <Input type="number" placeholder={"\u8bf7\u8f93\u5165\u5355\u4f4d\u4ea7\u54c1\u7efc\u5408\u80fd\u8017"} />
          </FormField>
          <FormField label={"\u80fd\u6e90\u7ba1\u7406\u4f53\u7cfb\u8ba4\u8bc1"} helperText={"\u5982\u5df2\u901a\u8fc7 ISO 50001 \u8ba4\u8bc1\uff0c\u8bf7\u8f93\u5165\u8bc1\u4e66\u7f16\u53f7"}>
            <Input placeholder={"\u8bf7\u8f93\u5165\u8ba4\u8bc1\u8bc1\u4e66\u7f16\u53f7\uff08\u5982\u6709\uff09"} />
          </FormField>
        </div>
      </FormGroup>

      <FormGroup
        title={"\u4ea7\u54c1\u914d\u7f6e"}
        description={"\u4f01\u4e1a\u4e3b\u8981\u4ea7\u54c1\u53ca\u4ea7\u91cf\u4fe1\u606f"}
        completionStatus="incomplete"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <FormField label={"\u4e3b\u8981\u4ea7\u54c1\u540d\u79f0"} required>
            <Input placeholder={"\u8bf7\u8f93\u5165\u4e3b\u8981\u4ea7\u54c1\u540d\u79f0"} />
          </FormField>
          <FormField label={"\u5e74\u4ea7\u503c"} suffix={"\u4e07\u5143"} required>
            <Input type="number" placeholder={"\u8bf7\u8f93\u5165\u5e74\u4ea7\u503c"} />
          </FormField>
          <FormField label={"\u4ece\u4e1a\u4eba\u6570"} suffix={"\u4eba"}>
            <Input type="number" placeholder={"\u8bf7\u8f93\u5165\u4ece\u4e1a\u4eba\u6570"} />
          </FormField>
          <FormField label={"\u5efa\u7b51\u9762\u79ef"} suffix="m\u00b2">
            <Input type="number" placeholder={"\u8bf7\u8f93\u5165\u5efa\u7b51\u9762\u79ef"} />
          </FormField>
        </div>
      </FormGroup>

      <FormGroup
        title={"\u7528\u80fd\u5355\u5143\u914d\u7f6e"}
        description={"\u751f\u4ea7\u8f66\u95f4\u3001\u8f85\u52a9\u7cfb\u7edf\u7b49\u7528\u80fd\u5355\u5143\u5212\u5206"}
        completionStatus="incomplete"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <FormField label={"\u4e3b\u8981\u751f\u4ea7\u8f66\u95f4\u6570\u91cf"} suffix={"\u4e2a"}>
            <Input type="number" placeholder={"\u8bf7\u8f93\u5165\u4e3b\u8981\u751f\u4ea7\u8f66\u95f4\u6570\u91cf"} />
          </FormField>
          <FormField label={"\u8f85\u52a9\u7cfb\u7edf"} helperText={"\u5982\u7a7a\u538b\u7ad9\u3001\u9505\u7089\u623f\u3001\u53d8\u914d\u7535\u5ba4\u7b49"}>
            <Input placeholder={"\u8bf7\u8f93\u5165\u8f85\u52a9\u7cfb\u7edf\u540d\u79f0\uff0c\u591a\u4e2a\u4ee5\u9017\u53f7\u5206\u9694"} />
          </FormField>
          <FormField label={"\u80fd\u6e90\u8ba1\u91cf\u5668\u5177\u914d\u7f6e\u7387"} suffix="%">
            <Input type="number" placeholder={"\u8bf7\u8f93\u5165\u914d\u7f6e\u7387"} />
          </FormField>
        </div>
      </FormGroup>
    </div>
  );
}
