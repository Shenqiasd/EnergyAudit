"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  useDictionaries,
  useCreateDictionary,
  useUpdateDictionary,
  useDeleteDictionary,
} from "@/lib/api/hooks/use-master-data";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Search } from "lucide-react";

import type { DictionaryItem } from "@/lib/api/hooks/use-master-data";

const categories = [
  { value: "industry", label: "行业分类" },
  { value: "energy_type", label: "能源品种" },
  { value: "measurement_unit", label: "计量单位" },
  { value: "product_type", label: "产品类型" },
  { value: "unit_type", label: "单元类型" },
];

interface FormData {
  code: string;
  name: string;
  parentCode: string;
  sortOrder: string;
}

const emptyForm: FormData = {
  code: "",
  name: "",
  parentCode: "",
  sortOrder: "0",
};

function TreeNode({
  item,
  onEdit,
  onDelete,
  level = 0,
}: {
  item: DictionaryItem;
  onEdit: (item: DictionaryItem) => void;
  onDelete: (item: DictionaryItem) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-[hsl(var(--muted-foreground))]"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="flex-1 text-sm text-[hsl(var(--foreground))]">
          {item.name}
        </span>
        <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
          {item.code}
        </span>
        <Badge variant={item.isActive ? "success" : "default"} className="text-xs">
          {item.isActive ? "启用" : "停用"}
        </Badge>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Pencil size={12} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
            <Trash2 size={12} className="text-[hsl(var(--danger))]" />
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DictionariesPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: items, isLoading } = useDictionaries(activeCategory);
  const createMutation = useCreateDictionary();
  const updateMutation = useUpdateDictionary();
  const deleteMutation = useDeleteDictionary();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DictionaryItem | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: DictionaryItem) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      parentCode: item.parentCode ?? "",
      sortOrder: String(item.sortOrder),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        category: activeCategory,
        name: form.name,
        parentCode: form.parentCode || undefined,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      });
    } else {
      await createMutation.mutateAsync({
        category: activeCategory,
        code: form.code,
        name: form.name,
        parentCode: form.parentCode || undefined,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async (item: DictionaryItem) => {
    await deleteMutation.mutateAsync({ id: item.id, category: activeCategory });
    setDeleteConfirmItem(null);
  };

  const filterTree = (nodes: DictionaryItem[], query: string): DictionaryItem[] => {
    if (!query) return nodes;
    return nodes
      .map((node) => {
        const filteredChildren = filterTree(node.children, query);
        const matches =
          node.name.includes(query) || node.code.includes(query);
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter((n): n is DictionaryItem => n !== null);
  };

  const filteredItems = filterTree(items ?? [], searchQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">字典管理</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          管理平台基础字典数据，包括行业分类、能源品种、计量单位等
        </p>
      </div>

      <div className="flex gap-2 border-b border-[hsl(var(--border))]">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setActiveCategory(cat.value);
              setSearchQuery("");
            }}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {categories.find((c) => c.value === activeCategory)?.label ?? ""}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
              />
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-[hsl(var(--border))] bg-white py-1.5 pl-9 pr-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus size={16} />
              新增
            </Button>
          </div>
        </CardHeader>

        {isLoading ? (
          <Loading text="加载字典数据..." className="py-8" />
        ) : filteredItems.length > 0 ? (
          <div className="divide-y divide-[hsl(var(--border))]">
            {filteredItems.map((item) => (
              <TreeNode
                key={item.id}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={setDeleteConfirmItem}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            {searchQuery ? "未找到匹配的字典项" : "暂无字典数据"}
          </p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑字典项" : "新增字典项"}
      >
        <div className="space-y-4">
          <Input
            label="编码"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="唯一编码标识"
            disabled={!!editingId}
          />
          <Input
            label="名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="字典项名称"
          />
          <Input
            label="父级编码（可选）"
            value={form.parentCode}
            onChange={(e) => setForm({ ...form, parentCode: e.target.value })}
            placeholder="留空表示顶级项"
          />
          <Input
            label="排序号"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.code || !form.name}
            >
              {editingId ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title="确认删除"
      >
        <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
          确定要删除字典项 &ldquo;{deleteConfirmItem?.name}&rdquo; 吗？
          {deleteConfirmItem?.children && deleteConfirmItem.children.length > 0 && (
            <span className="mt-1 block text-[hsl(var(--danger))]">
              该项下有 {deleteConfirmItem.children.length} 个子项，删除后子项将失去父级关联。
            </span>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmItem(null)}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem)}
          >
            删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
