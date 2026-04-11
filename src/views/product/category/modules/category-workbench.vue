<template>
  <div class="flex flex-col gap-4">
    <section class="art-card-xs p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-lg font-semibold">{{ category.name }}</span>
            <ElTag
              :type="Number(category.enableStatus) === 1 ? 'success' : 'danger'"
              effect="plain"
            >
              {{ Number(category.enableStatus) === 1 ? '启用' : '停用' }}
            </ElTag>
            <ElTag v-if="snapshot" :type="snapshot.isLeaf ? 'success' : 'warning'" effect="plain">
              {{ snapshot.isLeaf ? '叶子分类' : '非叶子模板' }}
            </ElTag>
          </div>

          <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">
            <span>ID：{{ category.id }}</span>
            <span class="mx-2">/</span>
            <span>层级：{{ category.level }}</span>
            <span class="mx-2">/</span>
            <span>路径：{{ category.path || '—' }}</span>
          </div>
        </div>

        <div class="flex flex-wrap justify-end gap-2">
          <ElButton @click="$emit('create-child', category)">新增子类</ElButton>
          <ElButton @click="$emit('edit', category)">编辑</ElButton>
          <ElButton @click="$emit('toggle-status', category)">
            {{ Number(category.enableStatus) === 1 ? '停用' : '启用' }}
          </ElButton>
          <ElButton type="danger" @click="$emit('delete', category)">删除</ElButton>
        </div>
      </div>

      <ElDescriptions
        :column="summaryColumns"
        size="small"
        class="mt-4 category-workbench__summary"
      >
        <ElDescriptionsItem label="上级分类">
          {{ category.parentName || category.parentId || '一级分类' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="导航显示">
          {{ Number(category.isNav) === 1 ? '显示' : '隐藏' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="排序">
          {{ category.sort ?? 0 }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="关键词">
          {{ category.keywords || '—' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">
          {{ formatDateTime(category.createTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="更新时间">
          {{ formatDateTime(category.updateTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="描述" :span="3">
          {{ category.description || '—' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </section>

    <ElCard class="art-card-xs overflow-hidden" shadow="never">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="font-medium">分类工作台</div>
          <ElButton text @click="handleRefresh">刷新</ElButton>
        </div>
      </template>

      <div v-loading="snapshotLoading">
        <ElAlert
          v-if="snapshotError"
          :title="snapshotError"
          type="error"
          :closable="false"
          class="mb-4"
        />

        <ElAlert
          v-else-if="snapshot && !snapshot.isLeaf"
          title="非叶子分类，当前展示模板关系。"
          type="info"
          :closable="false"
          class="mb-4"
        />

        <ElTabs v-model="activeTab">
          <ElTabPane :label="`规格 (${specRows.length})`" name="spec">
            <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="text-sm text-[var(--el-text-color-secondary)]">
                已绑定 {{ specRows.length }} 个规格属性
              </div>
              <div class="flex flex-wrap gap-2">
                <ElButton @click="openAttributeManager(1)">属性库</ElButton>
                <ElButton
                  type="danger"
                  plain
                  :disabled="selectedSpecRows.length === 0"
                  @click="handleBatchUnbind('spec')"
                >
                  批量解绑（{{ selectedSpecRows.length }}）
                </ElButton>
                <ElButton type="primary" plain @click="openBindDrawer('spec')">绑定属性</ElButton>
              </div>
            </div>

            <CategoryRelationTable
              :rows="specRows"
              @row-click="handleSpecRowClick"
              @selection-change="handleSpecSelectionChange"
              @edit="openRelationDrawer($event, 'spec')"
              @delete="handleUnbindRow"
            />
          </ElTabPane>

          <ElTabPane :label="`参数 (${paramRows.length})`" name="param">
            <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="text-sm text-[var(--el-text-color-secondary)]">
                已绑定 {{ paramRows.length }} 个参数属性
              </div>
              <div class="flex flex-wrap gap-2">
                <ElButton @click="openAttributeManager(0)">属性库</ElButton>
                <ElButton
                  type="danger"
                  plain
                  :disabled="selectedParamRows.length === 0"
                  @click="handleBatchUnbind('param')"
                >
                  批量解绑（{{ selectedParamRows.length }}）
                </ElButton>
                <ElButton type="primary" plain @click="openBindDrawer('param')">绑定属性</ElButton>
              </div>
            </div>

            <CategoryRelationTable
              :rows="paramRows"
              @row-click="handleParamRowClick"
              @selection-change="handleParamSelectionChange"
              @edit="openRelationDrawer($event, 'param')"
              @delete="handleUnbindRow"
            />
          </ElTabPane>

          <ElTabPane :label="`品牌 (${brandRows.length})`" name="brand">
            <ElAlert
              v-if="snapshot && !snapshot.isLeaf"
              title="非叶子分类通常只维护模板关系，品牌建议绑定在叶子分类。"
              type="info"
              :closable="false"
              class="mb-4"
            />

            <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="text-sm text-[var(--el-text-color-secondary)]">
                已绑定 {{ brandRows.length }} 个品牌
              </div>
              <div class="flex flex-wrap gap-2">
                <ElButton :disabled="!canCopyBrandsFromParent" @click="handleCopyBrandsFromParent">
                  继承父分类品牌
                </ElButton>
                <ElButton
                  type="danger"
                  plain
                  :disabled="selectedBrandRows.length === 0"
                  @click="handleBatchUnbindBrands"
                >
                  批量解绑（{{ selectedBrandRows.length }}）
                </ElButton>
                <ElButton type="primary" plain @click="openBrandBindDrawer">绑定品牌</ElButton>
              </div>
            </div>

            <CategoryBrandTable
              :rows="brandRows"
              :loading="brandLoading"
              @selection-change="handleBrandSelectionChange"
              @delete="handleUnbindBrand"
            />
          </ElTabPane>

          <ElTabPane label="模板复制" name="template">
            <ElAlert
              title="选择来源分类后，可先预览差异，再决定是否应用到当前分类。"
              type="info"
              :closable="false"
              class="mb-4"
            />

            <div class="flex flex-col gap-4">
              <ElForm label-position="top" class="grid grid-cols-1 gap-4">
                <ElFormItem label="模板来源分类">
                  <ElTreeSelect
                    v-model="templateSourceCategoryId"
                    :data="templateSourceOptions"
                    :props="{ label: 'name', value: 'id', children: 'children' }"
                    check-strictly
                    filterable
                    clearable
                    placeholder="请选择来源分类"
                    class="w-full"
                  />
                </ElFormItem>

                <ElFormItem label="复制范围">
                  <CategorySegmentTabs v-model="templateScope" :options="templateScopeOptions" />
                </ElFormItem>
              </ElForm>

              <div class="flex flex-wrap items-center justify-end gap-2">
                <ElButton
                  :disabled="!templateSourceCategoryId"
                  @click="handlePreviewTemplate('merge')"
                >
                  预览合并
                </ElButton>
                <ElButton
                  type="primary"
                  plain
                  :disabled="!templateSourceCategoryId"
                  @click="handlePreviewTemplate('replace')"
                >
                  预览替换
                </ElButton>
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </ElCard>

    <ElDrawer
      v-model="relationDrawerVisible"
      :title="relationDrawerTitle"
      :size="relationDrawerSize"
      :before-close="handleRelationDrawerBeforeClose"
      :close-on-click-modal="!inspectorPinned"
      :close-on-press-escape="!inspectorPinned"
      destroy-on-close
      @closed="handleRelationDrawerClosed"
    >
      <template v-if="relationDraft && relationAttr">
        <div class="flex flex-col gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-base font-semibold">{{ relationAttr.name }}</span>
              <ElTag effect="plain">{{ currentRelationTab === 'spec' ? '规格' : '参数' }}</ElTag>
              <ElTag v-if="Number(relationAttr.entryMethod) === 1" effect="plain">预设选项</ElTag>
            </div>
            <div
              v-if="
                inspectorFlow && currentRelationTab !== 'brand' && currentRelationTab !== 'template'
              "
              class="mt-1 text-xs text-[var(--el-text-color-secondary)]"
            >
              连续编辑 {{ inspectorFlow.idx + 1 }} / {{ inspectorFlow.ids.length }}
            </div>
          </div>

          <ElForm
            label-position="top"
            class="grid grid-cols-1 gap-3 category-workbench__relation-form"
          >
            <ElFormItem label="分组">
              <div
                class="rounded-[var(--el-border-radius-base)] border border-[var(--el-border-color)] px-3 py-2 text-sm text-[var(--el-text-color-primary)]"
              >
                {{ relationDraft.groupName || '默认分组' }}
              </div>
            </ElFormItem>

            <ElFormItem label="排序">
              <ElInputNumber
                v-model="relationDraft.sort"
                :min="0"
                controls-position="right"
                class="w-full"
              />
            </ElFormItem>

            <ElFormItem label="是否必填">
              <ElSwitch v-model="relationRequiredValue" />
            </ElFormItem>

            <ElFormItem v-if="Number(relationAttr.entryMethod) === 1" label="自定义选项">
              <div class="mb-2 flex w-full justify-start">
                <ElButton
                  v-if="relationAttr.options.length"
                  text
                  @click="handleRestoreDefaultOptions"
                >
                  恢复默认
                </ElButton>
              </div>
              <OptionTagInput v-model="relationOptionValues" placeholder="输入后按回车或逗号添加" />
            </ElFormItem>
          </ElForm>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full flex-col gap-3 pr-1 md:flex-row md:items-center md:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <ElButton
              v-if="relationDraft && relationAttr"
              type="danger"
              plain
              :loading="unbindLoading"
              @click="handleUnbindFromDrawer"
            >
              解绑
            </ElButton>

            <template v-if="inspectorFlow">
              <ElButton :disabled="inspectorFlow.idx <= 0" @click="goInspectorPrev"
                >上一条</ElButton
              >
              <ElButton
                :disabled="inspectorFlow.idx + 1 >= inspectorFlow.ids.length"
                @click="goInspectorNext"
              >
                下一条
              </ElButton>
            </template>

            <ElButton @click="toggleInspectorPinned">
              {{ inspectorPinned ? '取消固定' : '固定编辑' }}
            </ElButton>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 md:ml-auto">
            <ElButton @click="relationDrawerVisible = false">取消</ElButton>
            <ElButton type="primary" :loading="relationSubmitting" @click="handleSaveRelation">
              保存
            </ElButton>
          </div>
        </div>
      </template>
    </ElDrawer>

    <ElDrawer
      v-model="bindDrawerVisible"
      :title="bindDrawerTitle"
      :size="bindDrawerSize"
      destroy-on-close
      @closed="handleBindDrawerClosed"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col items-start gap-3 md:flex-row md:items-stretch">
            <ElInput
              v-model.trim="bindKeyword"
              clearable
              placeholder="搜索名称或 ID"
              class="w-full md:flex-1"
              @keyup.enter="handleBindSearch"
              @clear="handleBindSearch"
            />
            <ElButton class="shrink-0" @click="handleBindSearch">搜索</ElButton>
          </div>

          <CategorySegmentTabs
            v-model="bindFilterStatus"
            :options="bindFilterOptions"
            @change="handleBindFilterStatusChange($event as BindFilterStatus)"
          />
        </div>

        <ArtTable
          v-loading="bindLoading"
          :data="bindList"
          row-key="id"
          :show-table-header="false"
          @selection-change="handleBindSelectionChange"
        >
          <ElTableColumn type="selection" width="48" :selectable="isBindItemSelectable" />

          <ElTableColumn label="属性" min-width="220">
            <template #default="{ row }">
              <div class="font-medium">
                {{ row.name }}
                <ElTag v-if="isBindItemBound(row.id)" size="small" effect="plain" class="ml-2">
                  已绑定
                </ElTag>
              </div>
              <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
                #{{ row.id }} / {{ formatWorkbenchEntryMethod(row.entryMethod) }}
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="单位" width="100">
            <template #default="{ row }">
              {{ row.unit || '—' }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="选项" min-width="220">
            <template #default="{ row }">
              <OptionTagPreview :options="row.optionList" />
            </template>
          </ElTableColumn>
        </ArtTable>

        <div v-if="selectedConfigurableBindRows.length" class="flex flex-col gap-3">
          <div class="text-sm font-medium">选中项配置</div>

          <div
            v-for="item in selectedConfigurableBindRows"
            :key="`bind-config-${item.id}`"
            class="rounded-lg border border-[var(--el-border-color-lighter)] p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-xs text-[var(--el-text-color-secondary)]">#{{ item.id }}</div>
            </div>

            <div class="mt-3">
              <div class="mb-2 text-sm text-[var(--el-text-color-secondary)]">绑定方式</div>
              <CategorySegmentTabs
                :model-value="bindModeMap[item.id]"
                :options="bindModeOptions"
                @update:model-value="setBindMode(item.id, $event)"
              />
            </div>

            <div v-if="bindModeMap[item.id] === 'custom'" class="mt-3">
              <OptionTagInput
                :model-value="getBindCustomOptions(item.id)"
                placeholder="每行一个选项，也支持用逗号分隔"
                @update:model-value="setBindCustomOptions(item.id, $event)"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end">
          <ElPagination
            background
            layout="prev, pager, next"
            :current-page="bindPagination.current"
            :page-size="bindPagination.size"
            :total="bindPagination.total"
            @current-change="handleBindPageChange"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex w-full flex-col gap-3 pr-1 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-sm text-[var(--el-text-color-secondary)] sm:order-1">
            已选 {{ selectedBindRows.length }} 项
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 sm:order-2">
            <ElButton @click="bindDrawerVisible = false">取消</ElButton>
            <ElButton
              type="primary"
              :loading="bindSubmitting"
              :disabled="selectedBindRows.length === 0"
              @click="handleBindSubmit"
            >
              确认绑定
            </ElButton>
          </div>
        </div>
      </template>
    </ElDrawer>

    <ElDrawer
      v-model="brandBindDrawerVisible"
      title="绑定品牌"
      :size="bindDrawerSize"
      destroy-on-close
      @closed="handleBrandBindDrawerClosed"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col items-start gap-3 md:flex-row md:items-stretch">
          <ElInput
            v-model.trim="brandBindKeyword"
            clearable
            placeholder="搜索品牌名称或 ID"
            class="w-full md:flex-1"
            @keyup.enter="loadUnboundBrandList"
            @clear="loadUnboundBrandList"
          />
          <ElButton class="shrink-0" @click="loadUnboundBrandList">搜索</ElButton>
        </div>

        <ArtTable
          v-loading="brandBindLoading"
          :data="brandBindList"
          row-key="id"
          :show-table-header="false"
          @selection-change="handleBrandBindSelectionChange"
        >
          <ElTableColumn type="selection" width="48" />

          <ElTableColumn label="品牌" min-width="260">
            <template #default="{ row }">
              <div class="flex items-center gap-3">
                <ElAvatar :src="row.logo" :size="36" shape="square">
                  {{ String(row.name || '').slice(0, 1) }}
                </ElAvatar>
                <div class="min-w-0">
                  <ElTooltip :content="row.name" placement="top" :show-after="400">
                    <div class="truncate font-medium">{{ row.name }}</div>
                  </ElTooltip>
                  <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
                    #{{ row.id }}
                  </div>
                </div>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="显示" width="100">
            <template #default="{ row }">
              <ElTag :type="Number(row.showStatus) === 1 ? 'success' : 'info'" effect="plain">
                {{ Number(row.showStatus) === 1 ? '显示' : '隐藏' }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="厂商" width="100">
            <template #default="{ row }">
              <ElTag :type="Number(row.factoryStatus) === 1 ? 'warning' : 'info'" effect="plain">
                {{ Number(row.factoryStatus) === 1 ? '是' : '否' }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="排序" width="90">
            <template #default="{ row }">
              {{ row.sort ?? 0 }}
            </template>
          </ElTableColumn>
        </ArtTable>
      </div>

      <template #footer>
        <div class="flex w-full flex-col gap-3 pr-1 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-sm text-[var(--el-text-color-secondary)] sm:order-1">
            已选 {{ selectedBrandBindRows.length }} 项
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 sm:order-2">
            <ElButton @click="brandBindDrawerVisible = false">取消</ElButton>
            <ElButton
              type="primary"
              :loading="brandBindSubmitting"
              :disabled="selectedBrandBindRows.length === 0"
              @click="handleBrandBindSubmit"
            >
              确认绑定
            </ElButton>
          </div>
        </div>
      </template>
    </ElDrawer>

    <ElDialog
      v-model="templatePreviewVisible"
      title="模板复制预览"
      :width="templatePreviewDialogWidth"
      destroy-on-close
    >
      <div v-loading="templatePreviewLoading" class="flex flex-col gap-4">
        <template v-if="templatePreview">
          <div class="flex flex-wrap gap-3">
            <ElTag effect="plain">新增 {{ templatePreview.summary.addCount }}</ElTag>
            <ElTag effect="plain">删除 {{ templatePreview.summary.removeCount }}</ElTag>
            <ElTag effect="plain">跳过 {{ templatePreview.summary.skipCount }}</ElTag>
            <ElTag effect="plain">{{ templateMode === 'merge' ? '合并模式' : '替换模式' }}</ElTag>
          </div>

          <ElAlert
            v-if="templateMode === 'replace'"
            title="替换模式会按预览结果清空并重建当前范围配置。"
            type="warning"
            :closable="false"
          />

          <div
            v-if="templateMode === 'merge' && (templatePreview.addAttrIds || []).length"
            class="rounded-lg border border-[var(--el-border-color-lighter)] p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-3">
                <ElSwitch v-model="templateCustomPick" />
                <div class="text-sm text-[var(--el-text-color-secondary)]"> 选择性复制新增项 </div>
              </div>

              <div v-if="templateCustomPick" class="text-sm text-[var(--el-text-color-secondary)]">
                已选 {{ templateSelectedAddAttrIds.length }} 项
              </div>
            </div>

            <template v-if="templateCustomPick">
              <div class="mt-3 flex flex-col gap-3 md:flex-row">
                <ElInput
                  v-model.trim="templatePickKeyword"
                  clearable
                  placeholder="搜索属性名称或 ID"
                  @clear="templatePickKeyword = ''"
                />
                <ElButton :disabled="templatePickItems.length === 0" @click="selectAllTemplatePick">
                  全选
                </ElButton>
                <ElButton
                  :disabled="templateSelectedAddAttrIds.length === 0"
                  @click="clearTemplatePick"
                >
                  清空
                </ElButton>
              </div>

              <div
                class="mt-3 max-h-72 overflow-auto rounded-lg border border-[var(--el-border-color-lighter)] p-3"
              >
                <ElCheckboxGroup v-model="templateSelectedAddAttrIds">
                  <div class="flex flex-col gap-2">
                    <ElCheckbox
                      v-for="item in templatePickItems"
                      :key="`template-pick-${item.attrId}`"
                      :label="item.attrId"
                    >
                      {{ item.attrName }} #{{ item.attrId }}
                    </ElCheckbox>
                  </div>
                </ElCheckboxGroup>
              </div>
            </template>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ElCard shadow="never">
              <template #header>
                <div class="font-medium">将新增</div>
              </template>
              <ElEmpty
                v-if="templatePreview.sampleAddList.length === 0"
                :image-size="60"
                description="无新增项"
              />
              <div v-else class="category-workbench__sample-list">
                <div
                  v-for="item in templatePreview.sampleAddList"
                  :key="`add-${item.attrId}`"
                  class="category-workbench__sample-item"
                >
                  <div class="font-medium">{{ item.attrName }}</div>
                  <div class="text-xs text-[var(--el-text-color-secondary)]">
                    #{{ item.attrId }} / {{ item.groupName || '默认分组' }}
                  </div>
                </div>
              </div>
            </ElCard>

            <ElCard shadow="never">
              <template #header>
                <div class="font-medium">将删除</div>
              </template>
              <ElEmpty
                v-if="templatePreview.sampleRemoveList.length === 0"
                :image-size="60"
                description="无删除项"
              />
              <div v-else class="category-workbench__sample-list">
                <div
                  v-for="item in templatePreview.sampleRemoveList"
                  :key="`remove-${item.attrId}`"
                  class="category-workbench__sample-item"
                >
                  <div class="font-medium">{{ item.attrName }}</div>
                  <div class="text-xs text-[var(--el-text-color-secondary)]">
                    #{{ item.attrId }} / {{ item.groupName || '默认分组' }}
                  </div>
                </div>
              </div>
            </ElCard>

            <ElCard shadow="never">
              <template #header>
                <div class="font-medium">将跳过</div>
              </template>
              <ElEmpty
                v-if="templatePreview.sampleSkipList.length === 0"
                :image-size="60"
                description="无跳过项"
              />
              <div v-else class="category-workbench__sample-list">
                <div
                  v-for="item in templatePreview.sampleSkipList"
                  :key="`skip-${item.attrId}`"
                  class="category-workbench__sample-item"
                >
                  <div class="font-medium">{{ item.attrName }}</div>
                  <div class="text-xs text-[var(--el-text-color-secondary)]">
                    #{{ item.attrId }} / {{ item.groupName || '默认分组' }}
                  </div>
                </div>
              </div>
            </ElCard>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <ElButton @click="templatePreviewVisible = false">取消</ElButton>
          <ElButton
            type="primary"
            :loading="templateApplying"
            :disabled="!templatePreview"
            @click="handleApplyTemplate"
          >
            确认应用
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <AttributeManagerDialog
      v-model="attributeManagerVisible"
      :preset-type="attributeManagerType"
      @changed="handleAttributePoolChanged"
    />
  </div>
</template>

<script setup lang="ts">
  import AttributeManagerDialog from './attribute-manager-dialog.vue'
  import CategoryBrandTable from './category-brand-table.vue'
  import CategoryRelationTable from './category-relation-table.vue'
  import CategorySegmentTabs from './category-segment-tabs.vue'
  import OptionTagInput from './option-tag-input.vue'
  import OptionTagPreview from './option-tag-preview.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import {
    bindCategoryAttributesBatch,
    fetchCategoryAttributePool,
    unbindCategoryAttribute,
    unbindCategoryAttributeBatch,
    updateCategoryAttributeRelation,
    type CategoryAttributeRelationBatchUnbindPayload,
    type CategoryAttributeType,
    type CategoryAttributePoolItem
  } from '@/api/category-attribute'
  import {
    fetchCategoryWorkbenchSnapshot,
    type CategoryAttributeRelationItem,
    type CategoryWorkbenchSnapshot
  } from '@/api/category-workbench'
  import { fetchCategoryTree, type CategoryDetailItem, type CategoryTreeItem } from '@/api/category'
  import {
    applyAttributeTemplate,
    previewAttributeTemplate,
    type AttributeTemplatePreviewItem,
    type TemplateMode,
    type TemplateScope
  } from '@/api/category-template'
  import {
    bindCategoryBrandsBatch,
    copyCategoryBrandsFromParent,
    fetchBrandsByCategoryId,
    fetchUnboundBrandsByCategoryId,
    unbindCategoryBrandsBatch,
    type BrandRelationBatchUnbindPayload,
    type BrandListItem,
    unbindCategoryBrand
  } from '@/api/brand'
  import { formatDateTime } from '@/utils/date'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'
  import {
    formatWorkbenchEntryMethod,
    getWorkbenchRelationOptions,
    normalizeWorkbenchOptionList,
    type WorkbenchAttr,
    type WorkbenchRelation,
    type WorkbenchRelationRow
  } from './category-workbench-shared'

  type WorkbenchTab = 'spec' | 'param' | 'brand' | 'template'
  type BindMode = 'all' | 'custom'
  type BindFilterStatus = 'addable' | 'bound' | 'all'

  interface InspectorFlowState {
    ids: number[]
    idx: number
    tab: 'spec' | 'param'
  }

  interface Props {
    category: CategoryDetailItem
  }

  interface Emits {
    (e: 'create-child', value: CategoryDetailItem): void
    (e: 'edit', value: CategoryDetailItem): void
    (e: 'toggle-status', value: CategoryDetailItem): void
    (e: 'delete', value: CategoryDetailItem): void
  }

  const props = defineProps<Props>()

  defineEmits<Emits>()
  const { width } = useWindowSize()

  const activeTab = ref<WorkbenchTab>('spec')
  const snapshotLoading = ref(false)
  const snapshotError = ref('')
  const snapshot = ref<CategoryWorkbenchSnapshot | null>(null)
  const brandLoading = ref(false)
  const brandRows = ref<BrandListItem[]>([])

  const relationDrawerVisible = ref(false)
  const relationSubmitting = ref(false)
  const unbindLoading = ref(false)
  const inspectorPinned = ref(false)
  const currentRelationTab = ref<WorkbenchTab>('spec')
  const relationDraft = ref<WorkbenchRelation | null>(null)
  const relationAttr = ref<WorkbenchAttr | null>(null)
  const relationOptionsText = ref('')
  const relationOrigin = ref<WorkbenchRelation | null>(null)
  const relationOriginOptionsText = ref('')
  const inspectorFlow = ref<InspectorFlowState | null>(null)

  const bindDrawerVisible = ref(false)
  const bindLoading = ref(false)
  const bindSubmitting = ref(false)
  const bindDrawerTab = ref<WorkbenchTab>('spec')
  const bindFilterStatus = ref<BindFilterStatus>('addable')
  const bindKeyword = ref('')
  const bindSourceList = ref<CategoryAttributePoolItem[]>([])
  const selectedBindRows = ref<CategoryAttributePoolItem[]>([])
  const bindPagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })
  const brandBindDrawerVisible = ref(false)
  const brandBindLoading = ref(false)
  const brandBindSubmitting = ref(false)
  const brandBindKeyword = ref('')
  const brandBindList = ref<BrandListItem[]>([])
  const selectedBrandBindRows = ref<BrandListItem[]>([])
  const attributeManagerVisible = ref(false)
  const attributeManagerType = ref<-1 | CategoryAttributeType>(-1)
  const templateSourceOptions = ref<CategoryTreeItem[]>([])
  const templateSourceCategoryId = ref<number | undefined>(undefined)
  const templateScope = ref<TemplateScope>('both')
  const templateMode = ref<TemplateMode>('merge')
  const templatePreviewVisible = ref(false)
  const templatePreviewLoading = ref(false)
  const templateApplying = ref(false)
  const templatePreview = ref<AttributeTemplatePreviewItem | null>(null)
  const templateCustomPick = ref(false)
  const templatePickKeyword = ref('')
  const templateSelectedAddAttrIds = ref<number[]>([])
  const templateScopeOptions = [
    { label: '规格', value: 'spec' },
    { label: '参数', value: 'param' },
    { label: '规格 + 参数', value: 'both' }
  ] as const
  const bindFilterOptions = [
    { label: '待绑定', value: 'addable' },
    { label: '已绑定', value: 'bound' },
    { label: '全部', value: 'all' }
  ] as const
  const bindModeOptions = [
    { label: '默认选项', value: 'all' },
    { label: '自定义选项', value: 'custom' }
  ] as const

  const relationDrawerTitle = computed(() =>
    currentRelationTab.value === 'spec' ? '编辑规格关系' : '编辑参数关系'
  )
  const relationDrawerSize = computed(() => (width.value < 768 ? '100%' : '520px'))
  const summaryColumns = computed(() => {
    if (width.value <= 767) return 1
    if (width.value <= 1200) return 2
    return 3
  })

  const bindDrawerTitle = computed(() =>
    bindDrawerTab.value === 'spec' ? '绑定规格属性' : '绑定参数属性'
  )
  const bindDrawerSize = computed(() => (width.value < 768 ? '100%' : '720px'))
  const templatePreviewDialogWidth = computed(
    () => `${Math.min(760, Math.max(width.value - 24, 320))}px`
  )

  const canCopyBrandsFromParent = computed(() => Number(props.category.parentId || 0) > 0)

  const bindModeMap = ref<Record<number, BindMode>>({})
  const bindCustomOptionsMap = ref<Record<number, string>>({})
  const selectedSpecRows = ref<WorkbenchRelationRow[]>([])
  const selectedParamRows = ref<WorkbenchRelationRow[]>([])
  const selectedBrandRows = ref<BrandListItem[]>([])

  const relationRequiredValue = computed({
    get: () => Number(relationDraft.value?.required ?? 0) === 1,
    set: (value: boolean) => {
      if (!relationDraft.value) return
      relationDraft.value.required = value ? 1 : 0
    }
  })

  const relationOptionValues = computed({
    get: () => parseOptionText(relationOptionsText.value),
    set: (value: string[]) => {
      relationOptionsText.value = value.join('\n')
    }
  })

  const selectedConfigurableBindRows = computed(() =>
    selectedBindRows.value.filter((item) => Number(item.entryMethod) === 1)
  )

  const relationDirty = computed(() => {
    if (!relationDraft.value || !relationOrigin.value) return false

    const currentOptions =
      Number(relationAttr.value?.entryMethod ?? 0) === 1
        ? parseOptionText(relationOptionsText.value)
        : []
    const originOptions =
      Number(relationAttr.value?.entryMethod ?? 0) === 1
        ? parseOptionText(relationOriginOptionsText.value)
        : []

    return (
      String(relationDraft.value.groupName || '') !==
        String(relationOrigin.value.groupName || '') ||
      Number(relationDraft.value.sort || 0) !== Number(relationOrigin.value.sort || 0) ||
      Number(relationDraft.value.required || 0) !== Number(relationOrigin.value.required || 0) ||
      !isSameOptionList(currentOptions, originOptions)
    )
  })

  const templatePickItems = computed(() => {
    const addIds = (templatePreview.value?.addAttrIds || []).map((value) => Number(value))
    const sampleMap = new Map(
      (templatePreview.value?.sampleAddList || []).map((item) => [
        Number(item.attrId),
        item.attrName || `属性#${item.attrId}`
      ])
    )
    const keyword = templatePickKeyword.value.trim().toLowerCase()

    return addIds
      .filter((attrId) => Number.isFinite(attrId))
      .map((attrId) => ({
        attrId,
        attrName: sampleMap.get(attrId) || `属性#${attrId}`
      }))
      .filter((item) => {
        if (!keyword) return true
        return (
          item.attrName.toLowerCase().includes(keyword) || String(item.attrId).includes(keyword)
        )
      })
  })

  function parseOptionText(rawText?: string): string[] {
    const text = String(rawText || '').trim()
    if (!text) return []

    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean)
      }
    } catch {
      // 后端返回普通字符串时，继续走分隔解析
    }

    return text
      .split(/[\n,，;；/|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function isSameOptionList(left: string[], right: string[]) {
    return (
      normalizeWorkbenchOptionList(left).join('\u0000') ===
      normalizeWorkbenchOptionList(right).join('\u0000')
    )
  }

  function mapSnapshotRowToRelationRow(row: CategoryAttributeRelationItem): WorkbenchRelationRow {
    const categoryOptions = parseOptionText(row.categoryOptions)
    const optionList = normalizeWorkbenchOptionList(row.optionList)
    const globalOptions = parseOptionText(row.globalOptions)
    const recommendOptions = categoryOptions.length
      ? categoryOptions
      : optionList.length
        ? optionList
        : globalOptions

    return {
      relation: {
        id: Number(row.relationId || 0),
        categoryId: props.category.id,
        attrId: Number(row.attrId || 0),
        groupName: String(row.groupName || '默认分组'),
        sort: Number(row.sort || 0),
        required: Number(row.required || 0) === 1 ? 1 : 0,
        options: categoryOptions.length ? categoryOptions : null
      },
      attr: {
        id: Number(row.attrId || 0),
        name: String(row.attrName || ''),
        type: Number(row.type || 0) === 1 ? 1 : 0,
        unit: row.unit,
        entryMethod: Number(row.entryMethod || 0) === 1 ? 1 : 0,
        options: recommendOptions,
        searchable: Number(row.searchable || 0) === 1 ? 1 : 0,
        filterable: Number(row.filterable || 0) === 1 ? 1 : 0
      }
    }
  }

  const specRows = computed(() =>
    (snapshot.value?.specs || [])
      .map(mapSnapshotRowToRelationRow)
      .sort(
        (left, right) =>
          left.relation.sort - right.relation.sort || left.relation.id - right.relation.id
      )
  )

  const paramRows = computed(() =>
    (snapshot.value?.params || [])
      .map(mapSnapshotRowToRelationRow)
      .sort(
        (left, right) =>
          left.relation.sort - right.relation.sort || left.relation.id - right.relation.id
      )
  )

  function getMaxSort(tab: WorkbenchTab) {
    const rows = tab === 'spec' ? specRows.value : paramRows.value
    return rows.reduce((maxValue, row) => Math.max(maxValue, Number(row.relation.sort || 0)), 0)
  }

  function isBindItemBound(attrId: number) {
    const boundAttrIds = new Set(
      (bindDrawerTab.value === 'spec' ? specRows.value : paramRows.value).map((row) =>
        Number(row.attr.id)
      )
    )
    return boundAttrIds.has(Number(attrId))
  }

  function isBindItemSelectable(row: CategoryAttributePoolItem) {
    return !isBindItemBound(row.id)
  }

  const bindFilteredList = computed(() => {
    const boundAttrIds = new Set(
      (bindDrawerTab.value === 'spec' ? specRows.value : paramRows.value).map((row) =>
        Number(row.attr.id)
      )
    )

    return bindSourceList.value.filter((item) => {
      const isBound = boundAttrIds.has(Number(item.id))
      if (bindFilterStatus.value === 'addable') return !isBound
      if (bindFilterStatus.value === 'bound') return isBound
      return true
    })
  })

  const bindList = computed(() => {
    const start = (bindPagination.current - 1) * bindPagination.size
    return bindFilteredList.value.slice(start, start + bindPagination.size)
  })

  function openRelationDrawer(row: WorkbenchRelationRow, tab: WorkbenchTab) {
    currentRelationTab.value = tab
    relationDraft.value = {
      ...row.relation,
      options: Array.isArray(row.relation.options) ? [...row.relation.options] : null
    }
    relationOrigin.value = {
      ...row.relation,
      options: Array.isArray(row.relation.options) ? [...row.relation.options] : null
    }
    relationAttr.value = {
      ...row.attr,
      options: [...row.attr.options]
    }
    relationOptionsText.value = getWorkbenchRelationOptions(row).join('\n')
    relationOriginOptionsText.value = relationOptionsText.value
    relationDrawerVisible.value = true
  }

  async function confirmDiscardRelation() {
    if (!relationDirty.value) return true
    if (inspectorPinned.value) {
      ElMessage.warning('当前处于固定编辑状态，请先取消固定')
      return false
    }

    try {
      await ElMessageBox.confirm('当前编辑尚未保存，确认放弃修改？', '提示', {
        type: 'warning',
        confirmButtonText: '放弃修改',
        cancelButtonText: '继续编辑'
      })
      return true
    } catch {
      return false
    }
  }

  async function handleRelationDrawerBeforeClose(done: () => void) {
    if (await confirmDiscardRelation()) {
      done()
    }
  }

  async function handleSpecRowClick(row: WorkbenchRelationRow) {
    if (!(await confirmDiscardRelation())) return
    openRelationDrawer(row, 'spec')
  }

  async function handleParamRowClick(row: WorkbenchRelationRow) {
    if (!(await confirmDiscardRelation())) return
    openRelationDrawer(row, 'param')
  }

  function findRelationRowByAttrId(attrId: number, tab: 'spec' | 'param') {
    const rows = tab === 'spec' ? specRows.value : paramRows.value
    return rows.find((row) => Number(row.attr.id) === Number(attrId)) || null
  }

  function handleRelationDrawerClosed() {
    relationSubmitting.value = false
    unbindLoading.value = false
    inspectorPinned.value = false
    relationDraft.value = null
    relationOrigin.value = null
    relationAttr.value = null
    relationOptionsText.value = ''
    relationOriginOptionsText.value = ''
    inspectorFlow.value = null
  }

  function handleRestoreDefaultOptions() {
    relationOptionValues.value = normalizeWorkbenchOptionList(relationAttr.value?.options)
  }

  async function handleSaveRelation() {
    if (!relationDraft.value || !relationAttr.value) return

    relationSubmitting.value = true
    try {
      const payloadBase = {
        id: Number(relationDraft.value.id || 0),
        categoryId: props.category.id,
        attrId: Number(relationAttr.value.id || 0),
        groupName: String(relationDraft.value.groupName || '').trim() || '默认分组',
        sort: Number(relationDraft.value.sort || 0),
        required: Number(relationDraft.value.required || 0) === 1 ? 1 : 0
      } as const

      if (Number(relationAttr.value.entryMethod) === 1) {
        const selectedOptions = parseOptionText(relationOptionsText.value)
        const defaultOptions = normalizeWorkbenchOptionList(relationAttr.value.options)

        if (isSameOptionList(selectedOptions, defaultOptions)) {
          try {
            await updateCategoryAttributeRelation({
              ...payloadBase,
              options: null
            })
          } catch {
            await updateCategoryAttributeRelation({
              ...payloadBase,
              options: []
            })
          }
        } else {
          await updateCategoryAttributeRelation({
            ...payloadBase,
            options: selectedOptions
          })
        }
      } else {
        await updateCategoryAttributeRelation({
          ...payloadBase,
          options: []
        })
      }

      ElMessage.success('保存成功')
      relationDrawerVisible.value = false
      await loadWorkbenchSnapshot()
    } finally {
      relationSubmitting.value = false
    }
  }

  async function handleUnbindRow(row: WorkbenchRelationRow) {
    await handleUnbind(row.attr.id)
  }

  async function handleUnbindFromDrawer() {
    if (!relationAttr.value) return
    await handleUnbind(relationAttr.value.id)
  }

  async function handleUnbind(attrId: number) {
    try {
      await ElMessageBox.confirm('确认解绑该属性？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    unbindLoading.value = true
    try {
      await unbindCategoryAttribute(props.category.id, Number(attrId))
      ElMessage.success('解绑成功')
      relationDrawerVisible.value = false
      inspectorFlow.value = null
      inspectorPinned.value = false
      await loadWorkbenchSnapshot()
    } finally {
      unbindLoading.value = false
    }
  }

  function handleSpecSelectionChange(rows: WorkbenchRelationRow[]) {
    selectedSpecRows.value = Array.isArray(rows) ? rows : []
  }

  function handleParamSelectionChange(rows: WorkbenchRelationRow[]) {
    selectedParamRows.value = Array.isArray(rows) ? rows : []
  }

  function handleBrandSelectionChange(rows: BrandListItem[]) {
    selectedBrandRows.value = Array.isArray(rows) ? rows : []
  }

  async function handleBatchUnbind(tab: 'spec' | 'param') {
    const rows = tab === 'spec' ? selectedSpecRows.value : selectedParamRows.value
    const attrIds = Array.from(
      new Set(rows.map((row) => Number(row.attr.id)).filter((value) => Number.isFinite(value)))
    )
    if (!attrIds.length) return

    try {
      await ElMessageBox.confirm(`确认批量解绑 ${attrIds.length} 个属性？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    const payload: CategoryAttributeRelationBatchUnbindPayload = {
      categoryId: props.category.id,
      attrIds
    }

    await unbindCategoryAttributeBatch(payload)
    ElMessage.success('已批量解绑')
    selectedSpecRows.value = []
    selectedParamRows.value = []
    inspectorFlow.value = null
    await loadWorkbenchSnapshot()
  }

  async function handleBatchUnbindBrands() {
    const brandIds = Array.from(
      new Set(
        selectedBrandRows.value
          .map((row) => Number(row.id))
          .filter((value) => Number.isFinite(value))
      )
    )
    if (!brandIds.length) return

    try {
      await ElMessageBox.confirm(`确认批量解绑 ${brandIds.length} 个品牌？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    const payload: BrandRelationBatchUnbindPayload = {
      categoryId: props.category.id,
      brandIds
    }

    await unbindCategoryBrandsBatch(payload)
    ElMessage.success('已批量解绑')
    selectedBrandRows.value = []
    await loadBrandList()
  }

  async function startInspectorFlow(attrIds: number[], tab: 'spec' | 'param') {
    const ids = Array.from(
      new Set(attrIds.map((value) => Number(value)).filter((value) => Number.isFinite(value)))
    )
    if (!ids.length) return

    inspectorFlow.value = { ids, idx: 0, tab }
    inspectorPinned.value = true
    const firstRow = findRelationRowByAttrId(ids[0]!, tab)
    if (firstRow) {
      openRelationDrawer(firstRow, tab)
    }
  }

  async function openInspectorFlowAt(idx: number) {
    if (!inspectorFlow.value) return
    if (!(await confirmDiscardRelation())) return
    const ids = inspectorFlow.value.ids
    const nextIdx = Math.max(0, Math.min(ids.length - 1, idx))
    const targetId = ids[nextIdx]
    if (targetId === undefined) return

    const row = findRelationRowByAttrId(targetId, inspectorFlow.value.tab)
    if (!row) return

    inspectorFlow.value = { ...inspectorFlow.value, idx: nextIdx }
    openRelationDrawer(row, inspectorFlow.value.tab)
  }

  async function goInspectorPrev() {
    if (!inspectorFlow.value) return
    await openInspectorFlowAt(inspectorFlow.value.idx - 1)
  }

  async function goInspectorNext() {
    if (!inspectorFlow.value) return
    if (inspectorFlow.value.idx + 1 >= inspectorFlow.value.ids.length) return
    await openInspectorFlowAt(inspectorFlow.value.idx + 1)
  }

  function toggleInspectorPinned() {
    if (inspectorFlow.value && inspectorPinned.value) {
      ElMessage.info('连续编辑进行中，无法取消固定')
      return
    }
    inspectorPinned.value = !inspectorPinned.value
  }

  function handleBindSelectionChange(rows: CategoryAttributePoolItem[]) {
    selectedBindRows.value = Array.isArray(rows) ? rows : []

    const nextModeMap = { ...bindModeMap.value }
    const nextCustomOptionsMap = { ...bindCustomOptionsMap.value }
    const selectedIds = new Set(selectedBindRows.value.map((item) => item.id))

    Object.keys(nextModeMap).forEach((key) => {
      if (!selectedIds.has(Number(key))) delete nextModeMap[Number(key)]
    })

    Object.keys(nextCustomOptionsMap).forEach((key) => {
      if (!selectedIds.has(Number(key))) delete nextCustomOptionsMap[Number(key)]
    })

    selectedConfigurableBindRows.value.forEach((item) => {
      nextModeMap[item.id] = nextModeMap[item.id] || 'all'
      nextCustomOptionsMap[item.id] =
        nextCustomOptionsMap[item.id] ?? (item.optionList || []).join('\n')
    })

    bindModeMap.value = nextModeMap
    bindCustomOptionsMap.value = nextCustomOptionsMap
  }

  function handleBindDrawerClosed() {
    bindLoading.value = false
    bindSubmitting.value = false
    bindKeyword.value = ''
    bindSourceList.value = []
    selectedBindRows.value = []
    bindPagination.current = 1
    bindPagination.total = 0
    bindModeMap.value = {}
    bindCustomOptionsMap.value = {}
    bindFilterStatus.value = 'addable'
  }

  function handleBrandBindSelectionChange(rows: BrandListItem[]) {
    selectedBrandBindRows.value = Array.isArray(rows) ? rows : []
  }

  function handleBrandBindDrawerClosed() {
    brandBindLoading.value = false
    brandBindSubmitting.value = false
    brandBindKeyword.value = ''
    brandBindList.value = []
    selectedBrandBindRows.value = []
  }

  function filterTemplateSourceTree(nodes: CategoryTreeItem[]): CategoryTreeItem[] {
    return (nodes || [])
      .filter((item) => item.id !== props.category.id)
      .map((item) => ({
        ...item,
        children: filterTemplateSourceTree(item.children || [])
      }))
  }

  function selectAllTemplatePick() {
    templateSelectedAddAttrIds.value = templatePickItems.value.map((item) => item.attrId)
  }

  function clearTemplatePick() {
    templateSelectedAddAttrIds.value = []
  }

  async function loadBindList() {
    bindLoading.value = true
    try {
      const data = await fetchCategoryAttributePool({
        current: 1,
        size: 500,
        keyword: bindKeyword.value || undefined,
        type: bindDrawerTab.value === 'spec' ? 1 : 0
      })
      bindSourceList.value = data.records
      bindPagination.total = bindFilteredList.value.length
    } finally {
      bindLoading.value = false
    }
  }

  async function openBindDrawer(tab: WorkbenchTab) {
    bindDrawerTab.value = tab
    bindPagination.current = 1
    bindKeyword.value = ''
    selectedBindRows.value = []
    bindModeMap.value = {}
    bindCustomOptionsMap.value = {}
    bindFilterStatus.value = 'addable'
    bindDrawerVisible.value = true
    await loadBindList()
  }

  async function handleBindSearch() {
    bindPagination.current = 1
    await loadBindList()
  }

  async function handleBindPageChange(page: number) {
    bindPagination.current = page
  }

  function handleBindFilterStatusChange(status?: BindFilterStatus) {
    if (status) {
      bindFilterStatus.value = status
    }
    bindPagination.current = 1
    selectedBindRows.value = []
  }

  function setBindMode(attrId: number, value: string | number) {
    bindModeMap.value = {
      ...bindModeMap.value,
      [attrId]: value as BindMode
    }
  }

  function getBindCustomOptions(attrId: number) {
    return parseOptionText(bindCustomOptionsMap.value[attrId])
  }

  function setBindCustomOptions(attrId: number, value: string[]) {
    bindCustomOptionsMap.value = {
      ...bindCustomOptionsMap.value,
      [attrId]: value.join('\n')
    }
  }

  async function handleBindSubmit() {
    if (!selectedBindRows.value.length) return

    for (const item of selectedConfigurableBindRows.value) {
      if (bindModeMap.value[item.id] !== 'custom') continue
      if (parseOptionText(bindCustomOptionsMap.value[item.id]).length === 0) {
        ElMessage.warning(`请为属性「${item.name}」填写至少一个自定义选项`)
        return
      }
    }

    bindSubmitting.value = true
    try {
      const baseSort = getMaxSort(bindDrawerTab.value)
      const defaultGroupName = bindDrawerTab.value === 'spec' ? '销售规格' : '基础参数'
      const currentTab = bindDrawerTab.value === 'param' ? 'param' : 'spec'
      const flowAttrIds = selectedBindRows.value
        .filter((item) =>
          currentTab === 'spec' ? Number(item.type) === 1 : Number(item.type) === 0
        )
        .map((item) => Number(item.id))

      const payloads = selectedBindRows.value.map((item, index) => ({
        categoryId: props.category.id,
        attrId: item.id,
        groupName: defaultGroupName,
        sort: baseSort + (index + 1) * 10,
        required: 0 as const,
        options:
          Number(item.entryMethod) === 1
            ? bindModeMap.value[item.id] === 'custom'
              ? parseOptionText(bindCustomOptionsMap.value[item.id])
              : item.optionList
            : []
      }))

      await bindCategoryAttributesBatch(props.category.id, payloads)
      ElMessage.success(`已绑定 ${payloads.length} 个属性`)
      bindDrawerVisible.value = false
      await loadWorkbenchSnapshot()

      if (flowAttrIds.length) {
        await nextTick()
        await startInspectorFlow(flowAttrIds, currentTab)
      }
    } finally {
      bindSubmitting.value = false
    }
  }

  async function loadBrandList() {
    brandLoading.value = true
    try {
      brandRows.value = await fetchBrandsByCategoryId(props.category.id)
    } catch {
      brandRows.value = []
    } finally {
      brandLoading.value = false
    }
  }

  function openAttributeManager(type: CategoryAttributeType) {
    attributeManagerType.value = type
    attributeManagerVisible.value = true
  }

  async function handleAttributePoolChanged() {
    if (bindDrawerVisible.value) {
      await loadBindList()
    }
    await loadWorkbenchSnapshot()
  }

  async function loadTemplateSourceOptions() {
    const tree = await fetchCategoryTree()
    templateSourceOptions.value = filterTemplateSourceTree(tree)
  }

  async function loadUnboundBrandList() {
    brandBindLoading.value = true
    try {
      const list = await fetchUnboundBrandsByCategoryId(props.category.id)
      const keyword = brandBindKeyword.value.trim()
      brandBindList.value = keyword
        ? list.filter((item) => item.name.includes(keyword) || String(item.id).includes(keyword))
        : list
    } finally {
      brandBindLoading.value = false
    }
  }

  async function openBrandBindDrawer() {
    brandBindDrawerVisible.value = true
    brandBindKeyword.value = ''
    selectedBrandBindRows.value = []
    await loadUnboundBrandList()
  }

  async function handleBrandBindSubmit() {
    if (!selectedBrandBindRows.value.length) return

    brandBindSubmitting.value = true
    try {
      const brandIds = selectedBrandBindRows.value.map((item) => item.id)
      await bindCategoryBrandsBatch(props.category.id, brandIds)
      ElMessage.success(`已绑定 ${brandIds.length} 个品牌`)
      brandBindDrawerVisible.value = false
      await loadBrandList()
    } finally {
      brandBindSubmitting.value = false
    }
  }

  async function handleUnbindBrand(brandId: number) {
    try {
      await ElMessageBox.confirm('确认解绑该品牌？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    brandLoading.value = true
    try {
      await unbindCategoryBrand(props.category.id, brandId)
      ElMessage.success('解绑成功')
      await loadBrandList()
    } finally {
      brandLoading.value = false
    }
  }

  async function handleCopyBrandsFromParent() {
    const parentCategoryId = Number(props.category.parentId || 0)
    if (!parentCategoryId) return

    await copyCategoryBrandsFromParent(parentCategoryId, props.category.id)
    await loadBrandList()
  }

  async function handlePreviewTemplate(mode: TemplateMode) {
    const sourceCategoryId = Number(templateSourceCategoryId.value || 0)
    if (!sourceCategoryId) {
      ElMessage.warning('请先选择来源分类')
      return
    }

    if (sourceCategoryId === props.category.id) {
      ElMessage.warning('模板来源不能选择当前分类')
      return
    }

    templateMode.value = mode
    templateCustomPick.value = false
    templatePickKeyword.value = ''
    templateSelectedAddAttrIds.value = []
    templatePreviewLoading.value = true
    templatePreviewVisible.value = true

    try {
      templatePreview.value = await previewAttributeTemplate({
        templateCategoryId: sourceCategoryId,
        targetCategoryId: props.category.id,
        mode,
        scope: templateScope.value
      })
    } finally {
      templatePreviewLoading.value = false
    }
  }

  async function handleApplyTemplate() {
    if (!templatePreview.value?.traceId || !templateSourceCategoryId.value) return

    if (templateMode.value === 'replace') {
      try {
        await ElMessageBox.confirm('替换模式会清空并重建当前范围配置，确认继续？', '请确认', {
          type: 'warning',
          confirmButtonText: '确认应用',
          cancelButtonText: '取消'
        })
      } catch {
        return
      }
    }

    templateApplying.value = true
    try {
      if (
        templateMode.value === 'merge' &&
        templateCustomPick.value &&
        templateSelectedAddAttrIds.value.length === 0
      ) {
        ElMessage.warning('请至少选择一个新增项')
        return
      }

      await applyAttributeTemplate({
        templateCategoryId: Number(templateSourceCategoryId.value),
        targetCategoryId: props.category.id,
        mode: templateMode.value,
        scope: templateScope.value,
        traceId: templatePreview.value.traceId,
        selectedAddAttrIds:
          templateMode.value === 'merge' && templateCustomPick.value
            ? templateSelectedAddAttrIds.value
            : undefined
      })
      templatePreviewVisible.value = false
      await loadWorkbenchSnapshot()
    } finally {
      templateApplying.value = false
    }
  }

  async function loadWorkbenchSnapshot() {
    snapshotLoading.value = true
    snapshotError.value = ''

    try {
      snapshot.value = await fetchCategoryWorkbenchSnapshot(props.category.id)
    } catch (error) {
      snapshot.value = null
      relationDrawerVisible.value = false
      bindDrawerVisible.value = false
      snapshotError.value =
        error instanceof Error ? error.message : '分类工作台加载失败，请确认后端已接入分类快照接口'
    } finally {
      snapshotLoading.value = false
    }
  }

  async function handleRefresh() {
    await Promise.all([loadWorkbenchSnapshot(), loadBrandList()])
  }

  watch(bindFilteredList, (list) => {
    bindPagination.total = list.length
    const totalPages = Math.max(1, Math.ceil(list.length / bindPagination.size))
    if (bindPagination.current > totalPages) {
      bindPagination.current = totalPages
    }
  })

  watch(
    () => props.category.id,
    async () => {
      activeTab.value = 'spec'
      relationDrawerVisible.value = false
      bindDrawerVisible.value = false
      brandBindDrawerVisible.value = false
      inspectorPinned.value = false
      brandRows.value = []
      templatePreviewVisible.value = false
      templatePreview.value = null
      templateCustomPick.value = false
      templatePickKeyword.value = ''
      templateSelectedAddAttrIds.value = []
      templateSourceCategoryId.value = props.category.parentId || undefined
      await Promise.all([loadWorkbenchSnapshot(), loadBrandList(), loadTemplateSourceOptions()])
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .category-workbench__summary {
    :deep(.el-descriptions__label) {
      width: 88px;
    }
  }

  .category-workbench__relation-form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-form-item:last-child) {
      margin-bottom: 0;
    }
  }

  :deep(.el-drawer__body) {
    padding-right: 10px;
    overflow: auto;
  }
</style>
