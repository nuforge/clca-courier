<!--
  Newsletter Management Page
  Admin interface for creating and managing newsletter issues
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h4 class="q-my-none">
            <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
            Newsletter Management
          </h4>
          <p class="text-body2 text-grey-6 q-my-none">
            Create and manage newsletter issues from approved content submissions
          </p>
        </div>
        <div class="col-auto">
          <q-btn-group>
          <q-btn
            color="secondary"
            icon="mdi-palette"
              label="Templates"
            @click="showTemplateDialog = true"
            />
            <q-btn
              color="info"
              icon="mdi-refresh"
              label="Refresh"
              @click="loadData"
              :loading="isLoading"
          />
          <q-btn
            color="primary"
            icon="add"
              label="New Issue"
            @click="showCreateDialog = true"
          />
          </q-btn-group>
        </div>
      </div>

      <!-- Statistics Overview -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-newspaper-variant" color="primary" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ issues.length }}</div>
              <div class="text-caption text-grey-6">Total</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-content-save-edit" color="orange" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ draftIssues.length }}</div>
              <div class="text-caption text-grey-6">Draft</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-cog" color="blue" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ generatingIssues.length }}</div>
              <div class="text-caption text-grey-6">Generating</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-check-circle" color="positive" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ readyIssues.length }}</div>
              <div class="text-caption text-grey-6">Ready</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-publish" color="info" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ publishedIssues.length }}</div>
              <div class="text-caption text-grey-6">Published</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-archive" color="grey" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ archivedIssues.length }}</div>
              <div class="text-caption text-grey-6">Archived</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Workflow Guide -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-help-circle" class="q-mr-sm" />
            Newsletter Workflow Guide
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-plus-circle" color="primary" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">1. Create Issue</div>
                  <div class="text-caption text-grey-6">Click "New Issue" to create a newsletter issue</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-format-list-bulleted" color="orange" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">2. Add Content</div>
                  <div class="text-caption text-grey-6">Click "Manage Content" to add approved submissions</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-file-pdf-box" color="positive" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">3. Generate PDF</div>
                  <div class="text-caption text-grey-6">Click "Generate PDF" to create the newsletter</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-publish" color="info" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">4. Publish</div>
                  <div class="text-caption text-grey-6">Change status to "Published" when ready</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Action Toolbar -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto">
              <q-btn color="primary" icon="mdi-refresh" label="Refresh" @click="loadData"
                :loading="isLoading" />
            </div>
            <div class="col-auto">
              <q-btn color="positive" icon="mdi-check-all" label="Bulk Publish" @click="showBulkPublishDialog"
                :disable="selectedIssues.length === 0" />
            </div>
            <div class="col-auto">
              <q-btn color="warning" icon="mdi-archive" label="Bulk Archive"
                @click="showBulkArchiveDialog" :disable="selectedIssues.length === 0" outline />
            </div>
            <div class="col">
              <q-space />
            </div>
            <div class="col-auto">
              <q-toggle v-model="autoRefresh" label="Auto-refresh" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Issues List -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-format-list-bulleted" class="q-mr-sm" />
            Newsletter Issues
          </div>

          <!-- Content Tabs -->
          <q-tabs v-model="activeTab" dense class="text-grey" active-color="primary" indicator-color="primary"
            align="justify" narrow-indicator>
            <q-tab name="all">
              <q-icon name="mdi-newspaper-variant" color="primary" class="q-mr-sm" />
              All ({{ issues.length }})
            </q-tab>
            <q-tab name="draft">
              <q-icon name="mdi-content-save-edit" color="orange" class="q-mr-sm" />
              Draft ({{ draftIssues.length }})
            </q-tab>
            <q-tab name="generating">
              <q-icon name="mdi-cog" color="blue" class="q-mr-sm" />
              Generating ({{ generatingIssues.length }})
            </q-tab>
            <q-tab name="ready">
              <q-icon name="mdi-check-circle" color="positive" class="q-mr-sm" />
              Ready ({{ readyIssues.length }})
            </q-tab>
            <q-tab name="published">
              <q-icon name="mdi-publish" color="info" class="q-mr-sm" />
              Published ({{ publishedIssues.length }})
            </q-tab>
            <q-tab name="archived">
              <q-icon name="mdi-archive" color="grey" class="q-mr-sm" />
              Archived ({{ archivedIssues.length }})
            </q-tab>
            <q-tab name="new-issues">
              <q-icon name="mdi-plus-circle" color="primary" class="q-mr-sm" />
              New Issues ({{ newIssues.length }})
            </q-tab>
            <q-tab name="existing">
              <q-icon name="mdi-newspaper-variant" color="secondary" class="q-mr-sm" />
              Existing ({{ existingNewsletters.length }})
            </q-tab>
          </q-tabs>

          <q-separator />

          <q-table
            :rows="filteredIssues"
            :columns="issueColumns"
            row-key="id"
            :loading="isLoading"
            :pagination="{ rowsPerPage: 10 }"
            :selected="selectedIssues"
            @update:selected="selectedIssues = $event as string[]"
            selection="multiple"
            flat
            bordered
          >
            <template v-slot:body-cell-type="props">
              <q-td :props="props">
                <q-badge
                  :color="props.value === 'issue' ? 'primary' : 'secondary'"
                  :label="props.value === 'issue' ? 'New Issue' : 'Newsletter'"
                  :icon="props.value === 'issue' ? 'mdi-plus-circle' : 'mdi-newspaper-variant'"
                />
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="getStatusColor(props.value)"
                  :label="props.value"
                  class="text-capitalize"
                />
              </q-td>
            </template>

            <template v-slot:body-cell-submissions="props">
              <q-td :props="props">
                <div class="column items-center q-gutter-xs">
                  <q-badge
                    :color="props.value.length > 0 ? 'positive' : 'grey'"
                    :label="`${props.value.length} items`"
                  />
                  <div v-if="props.row.type === 'issue'" class="text-caption text-grey-6">
                    {{ props.value.length === 0 ? 'No content' :
                       props.row.finalPdfUrl ? 'PDF ready' :
                       props.row.status === 'generating' ? 'Generating...' : 'Ready for PDF' }}
                  </div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="row q-gutter-xs">
                  <!-- Manage Content - for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-format-list-bulleted"
                    color="primary"
                    @click="viewIssue(props.row)"
                  >
                    <q-tooltip>Manage Content ({{ props.row.submissions.length }} items)</q-tooltip>
                  </q-btn>

                  <!-- Layout Pages - for issues with content -->
                  <q-btn
                    v-if="props.row.type === 'issue' && props.row.submissions.length > 0"
                    flat
                    dense
                    size="sm"
                    icon="mdi-view-dashboard"
                    color="info"
                    @click="layoutPages(props.row)"
                  >
                    <q-tooltip>Layout Pages</q-tooltip>
                  </q-btn>

                  <!-- Edit Issue - for all issues -->
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="mdi-cog"
                    color="secondary"
                    @click="editIssue(props.row)"
                  >
                    <q-tooltip>{{ props.row.type === 'issue' ? 'Edit Issue' : 'Edit Newsletter' }}</q-tooltip>
                  </q-btn>

                  <!-- Unpublish - for published issues -->
                  <q-btn
                    v-if="props.row.status === 'published'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-publish-off"
                    color="warning"
                    @click="unpublishIssue(props.row)"
                  >
                    <q-tooltip>Unpublish Newsletter</q-tooltip>
                  </q-btn>

                  <!-- Generate PDF - only for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-file-pdf-box"
                    color="positive"
                    @click="generatePdf(props.row)"
                    :loading="props.row.status === 'generating'"
                    :disable="props.row.submissions.length === 0 || props.row.status === 'generating'"
                  >
                    <q-tooltip>
                      {{ props.row.submissions.length === 0 ? 'Add content first' :
                         props.row.status === 'generating' ? 'Generating PDF...' :
                         props.row.finalPdfUrl ? 'Regenerate PDF' : 'Generate PDF' }}
                    </q-tooltip>
                  </q-btn>

                  <!-- Download PDF - for both types if PDF exists -->
                  <q-btn
                    v-if="props.row.finalPdfUrl"
                    flat
                    dense
                    size="sm"
                    icon="mdi-download"
                    color="info"
                    @click="downloadPdf(props.row)"
                  >
                    <q-tooltip>Download PDF</q-tooltip>
                  </q-btn>

                  <!-- View Newsletter - for existing newsletters -->
                  <q-btn
                    v-if="props.row.type === 'newsletter'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-eye"
                    color="primary"
                    @click="viewNewsletter(props.row)"
                  >
                    <q-tooltip>View Newsletter</q-tooltip>
                  </q-btn>

                  <!-- Duplicate Issue - for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-content-duplicate"
                    color="info"
                    @click="duplicateIssue(props.row)"
                  >
                    <q-tooltip>Duplicate Issue</q-tooltip>
                  </q-btn>

                  <!-- Delete Issue - for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-delete"
                    color="negative"
                    @click="deleteIssue(props.row)"
                  >
                    <q-tooltip>Delete Issue</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Create Issue Dialog -->
      <q-dialog v-model="showCreateDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Create New Newsletter Issue</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form @submit="createIssue" class="q-gutter-md">
              <q-input
                v-model="newIssue.title"
                label="Issue Title"
                hint="e.g., 'Summer 2025 Newsletter'"
                :rules="[val => !!val || 'Title is required']"
                filled
              />

              <q-input
                v-model="newIssue.issueNumber"
                label="Issue Number"
                hint="e.g., '2025-03' or 'Summer-2025'"
                :rules="[val => !!val || 'Issue number is required']"
                filled
              />

              <q-input
                v-model="newIssue.publicationDate"
                type="date"
                label="Publication Date"
                :rules="[val => !!val || 'Publication date is required']"
                filled
              />

              <div class="row q-gutter-sm">
                <q-btn
                  label="Cancel"
                  color="grey"
                  flat
                  v-close-popup
                />
                <q-btn
                  label="Create Issue"
                  color="primary"
                  type="submit"
                  :loading="isCreating"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Edit Issue Dialog -->
      <q-dialog v-model="showEditDialog" persistent>
        <q-card style="min-width: 500px">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">
              {{ selectedIssue?.type === 'issue' ? 'Edit Newsletter Issue' : 'Edit Newsletter' }}
            </div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form @submit="updateIssue" class="q-gutter-md">
              <q-input
                v-model="editForm.title"
                label="Issue Title"
                hint="e.g., 'Summer 2025 Newsletter'"
                :rules="[val => !!val || 'Title is required']"
                filled
              />

              <q-input
                v-model="editForm.issueNumber"
                label="Issue Number"
                hint="e.g., '2025-03' or 'Summer-2025'"
                :rules="[val => !!val || 'Issue number is required']"
                filled
              />

              <q-input
                v-model="editForm.publicationDate"
                type="date"
                label="Publication Date"
                :rules="[val => !!val || 'Publication date is required']"
                filled
              />

              <q-select
                v-if="selectedIssue?.type === 'issue'"
                v-model="editForm.status"
                :options="statusOptions"
                label="Status"
                filled
                emit-value
                map-options
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="getStatusIcon(scope.opt.value)" :color="getStatusColor(scope.opt.value)" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>{{ getStatusDescription(scope.opt.value) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-select
                v-model="editForm.template"
                :options="templateOptions"
                label="Newsletter Template"
                filled
                emit-value
                map-options
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon name="mdi-file-document-outline" color="secondary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        flat
                        dense
                        icon="mdi-eye"
                        @click.stop="previewTemplate(scope.opt.value)"
                        size="sm"
                      >
                        <q-tooltip>Preview Template</q-tooltip>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-banner v-if="selectedIssue?.type === 'newsletter'" rounded class="bg-info text-white">
                <template v-slot:avatar>
                  <q-icon name="mdi-information" />
                </template>
                You are editing an existing newsletter. Some options like status management are not available for existing newsletters.
              </q-banner>

              <div class="row q-gutter-sm">
                <q-btn
                  label="Cancel"
                  color="grey"
                  flat
                  v-close-popup
                />
                <q-btn
                  label="Update Issue"
                  color="primary"
                  type="submit"
                  :loading="isEditing"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Issue Content Dialog -->
      <q-dialog v-model="showContentDialog" maximized>
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">
              <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
              {{ selectedIssue?.title }} - Content Management
              <q-badge v-if="selectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
                Read-only (Existing Newsletter)
              </q-badge>
              <q-badge v-else color="info" class="q-ml-sm">
                {{ selectedIssue?.submissions.length || 0 }} content items
              </q-badge>
            </div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Available Content -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-h6 q-mb-md">
                      <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
                      Available Content
                      <q-badge v-if="selectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
                        Not applicable for existing newsletters
                      </q-badge>
                    </div>

                    <q-list separator>
                      <q-item
                        v-for="submission in availableContent"
                        :key="submission.id"
                        clickable
                        @click="addToIssue(submission.id)"
                        :disable="selectedIssue?.submissions.includes(submission.id) || selectedIssue?.type === 'newsletter'"
                      >
                        <q-item-section avatar>
                          <q-avatar color="primary" text-color="white">
                            {{ submission.title.charAt(0).toUpperCase() }}
                          </q-avatar>
                        </q-item-section>

                        <q-item-section>
                          <q-item-label>{{ submission.title }}</q-item-label>
                          <q-item-label caption>
                            {{ submission.description?.substring(0, 100) }}...
                          </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-btn
                            flat
                            dense
                            icon="mdi-plus"
                            color="positive"
                            @click.stop="addToIssue(submission.id)"
                            :disable="selectedIssue?.submissions.includes(submission.id) || selectedIssue?.type === 'newsletter'"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Selected Content -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-h6 q-mb-md">
                      <q-icon name="mdi-check-circle" class="q-mr-sm" />
                      Selected Content ({{ selectedIssue?.submissions.length || 0 }})
                      <q-badge v-if="selectedIssue?.type === 'newsletter'" color="info" class="q-ml-sm">
                        Existing newsletters don't have selectable content
                      </q-badge>
                    </div>

                    <q-list separator>
                      <q-item
                        v-for="(submissionId, index) in selectedIssue?.submissions"
                        :key="submissionId"
                        clickable
                        @click="removeFromIssue(submissionId)"
                        :disable="selectedIssue?.type === 'newsletter'"
                        class="content-item"
                      >
                        <q-item-section avatar>
                          <q-avatar color="positive" text-color="white">
                            {{ getSubmissionTitle(submissionId)?.charAt(0).toUpperCase() }}
                          </q-avatar>
                        </q-item-section>

                        <q-item-section>
                          <q-item-label>{{ getSubmissionTitle(submissionId) }}</q-item-label>
                          <q-item-label caption>Order: {{ index + 1 }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <div class="row q-gutter-xs">
                            <!-- Move Up -->
                            <q-btn
                              v-if="index > 0"
                              flat
                              dense
                              icon="mdi-arrow-up"
                              color="primary"
                              size="sm"
                              @click.stop="moveContentUp(index)"
                              :disable="selectedIssue?.type === 'newsletter'"
                            >
                              <q-tooltip>Move Up</q-tooltip>
                            </q-btn>

                            <!-- Move Down -->
                            <q-btn
                              v-if="index < (selectedIssue?.submissions.length || 0) - 1"
                              flat
                              dense
                              icon="mdi-arrow-down"
                              color="primary"
                              size="sm"
                              @click.stop="moveContentDown(index)"
                              :disable="selectedIssue?.type === 'newsletter'"
                            >
                              <q-tooltip>Move Down</q-tooltip>
                            </q-btn>

                            <!-- Remove -->
                          <q-btn
                            flat
                            dense
                            icon="mdi-minus"
                            color="negative"
                              size="sm"
                            @click.stop="removeFromIssue(submissionId)"
                              :disable="selectedIssue?.type === 'newsletter'"
                            >
                              <q-tooltip>Remove</q-tooltip>
                            </q-btn>
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-list>

                    <!-- Show message for existing newsletters -->
                    <div v-if="selectedIssue?.type === 'newsletter'" class="text-center text-grey-6 q-pa-lg">
                      <q-icon name="mdi-information" size="2rem" class="q-mb-sm" />
                      <div>This is an existing newsletter with fixed content.</div>
                      <div>Use the "View Newsletter" button to open the PDF.</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Template Management Dialog -->
      <q-dialog v-model="showTemplateDialog" maximized>
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Template Management</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Available Templates -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-h6">Available Templates</div>
                    <div class="text-caption text-grey-6">Click to preview or test templates</div>
                  </q-card-section>

                  <q-card-section>
                    <q-list>
                      <q-item
                        v-for="template in availableTemplates"
                        :key="template"
                        clickable
                        @click="previewTemplate(template)"
                      >
                        <q-item-section>
                          <q-item-label>{{ getTemplateDisplayName(template) }}</q-item-label>
                          <q-item-label caption>{{ getTemplateDescription(template) }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-btn
                            flat
                            icon="preview"
                            @click.stop="previewTemplate(template)"
                            size="sm"
                          />
                          <q-btn
                            flat
                            icon="mdi-test-tube"
                            @click.stop="testTemplate(template)"
                            size="sm"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Template Preview -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-h6">Template Preview</div>
                    <div class="text-caption text-grey-6">Preview of selected template</div>
                  </q-card-section>

                  <q-card-section>
                    <div v-if="selectedTemplatePreview" class="template-preview-container">
                      <iframe
                        :srcdoc="selectedTemplatePreview"
                        class="template-preview-iframe"
                        sandbox="allow-same-origin"
                      />
                    </div>
                    <div v-else class="text-center text-grey-6 q-pa-lg">
                      Select a template to preview
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Page Layout Management Dialog -->
      <q-dialog v-model="showLayoutDialog" maximized>
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">
              <q-icon name="mdi-view-dashboard" class="q-mr-sm" />
              Page Layout Manager - {{ selectedIssue?.title }}
            </div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section class="full-height">
            <div class="row q-col-gutter-md full-height">
              <!-- Content Library -->
              <div class="col-12 col-lg-3">
                <q-card flat bordered class="full-height">
                  <q-card-section>
                    <div class="text-h6 q-mb-md">
                      <q-icon name="mdi-library" class="q-mr-sm" />
                      Content Library
                    </div>
                  </q-card-section>

                  <q-card-section class="q-pt-none">
                    <q-list>
                      <q-item
                        v-for="submissionId in selectedIssue?.submissions"
                        :key="submissionId"
                        class="content-library-item"
                        draggable="true"
                        @dragstart="handleDragStart($event, submissionId)"
                      >
                        <q-item-section avatar>
                          <q-avatar color="primary" text-color="white" size="sm">
                            {{ getSubmissionTitle(submissionId)?.charAt(0).toUpperCase() }}
                          </q-avatar>
                        </q-item-section>

                        <q-item-section>
                          <q-item-label class="text-body2">{{ getSubmissionTitle(submissionId) }}</q-item-label>
                          <q-item-label caption>{{ getSubmissionType(submissionId) }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-icon name="mdi-drag" color="grey-5" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Page Preview Area -->
              <div class="col-12 col-lg-6">
                <q-card flat bordered class="full-height">
                  <q-card-section>
                    <div class="row items-center q-mb-md">
                      <div class="text-h6">
                        <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
                        Page Preview
                      </div>
                      <q-space />
                      <q-btn-dropdown
                        color="secondary"
                        icon="mdi-palette"
                        label="Template"
                        no-caps
                      >
                        <q-list>
                          <q-item
                            v-for="template in templateOptions"
                            :key="template.value"
                            clickable
                            @click="changeTemplate(template.value)"
                          >
                            <q-item-section>{{ template.label }}</q-item-section>
                          </q-item>
                        </q-list>
                      </q-btn-dropdown>
                    </div>
                  </q-card-section>

                  <q-card-section class="q-pt-none">
                    <div class="page-preview-container">
                      <div class="page-preview"
                           @drop="handleDrop($event)"
                           @dragover.prevent
                           @dragenter.prevent>

                        <!-- Page Header -->
                        <div class="page-header">
                          <div class="newsletter-title">{{ selectedIssue?.title }}</div>
                          <div class="newsletter-date">{{ formatDate(selectedIssue?.publicationDate || new Date(), 'LONG') }}</div>
                        </div>

                        <!-- Content Areas -->
                        <div class="content-areas">
                          <div
                            v-for="(area, index) in contentAreas"
                            :key="index"
                            class="content-area"
                            :class="{ 'has-content': area.contentId }"
                            @drop="handleAreaDrop($event, index)"
                            @dragover.prevent
                            @dragenter.prevent
                          >
                            <div v-if="area.contentId" class="content-preview">
                              <div class="content-title">{{ getSubmissionTitle(area.contentId) }}</div>
                              <div class="content-type">{{ getSubmissionType(area.contentId) }}</div>
                              <q-btn
                                flat
                                dense
                                icon="mdi-close"
                                size="sm"
                                class="remove-content"
                                @click="removeFromArea(index)"
                              />
                            </div>
                            <div v-else class="drop-zone">
                              <q-icon name="mdi-plus-circle-outline" size="2rem" color="grey-5" />
                              <div class="text-caption text-grey-6">Drop content here</div>
                            </div>
                          </div>
                        </div>

                        <!-- Page Footer -->
                        <div class="page-footer">
                          <div class="page-number">Page 1</div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Layout Controls -->
              <div class="col-12 col-lg-3">
                <q-card flat bordered class="full-height">
                  <q-card-section>
                    <div class="text-h6 q-mb-md">
                      <q-icon name="mdi-cog" class="q-mr-sm" />
                      Layout Controls
                    </div>
                  </q-card-section>

                  <q-card-section class="q-pt-none">
                    <!-- Page Management -->
                    <div class="control-group q-mb-lg">
                      <div class="text-subtitle2 q-mb-sm">Pages</div>
                      <q-btn-group class="full-width">
                        <q-btn
                          outline
                          icon="mdi-plus"
                          label="Add Page"
                          @click="addPage"
                          class="col"
                        />
                        <q-btn
                          outline
                          icon="mdi-minus"
                          @click="removePage"
                          :disable="pages.length <= 1"
                        />
                      </q-btn-group>
                      <div class="text-caption text-grey-6 q-mt-xs">
                        {{ pages.length }} page{{ pages.length !== 1 ? 's' : '' }}
                      </div>
                    </div>

                    <!-- Template Settings -->
                    <div class="control-group q-mb-lg">
                      <div class="text-subtitle2 q-mb-sm">Layout</div>
                      <q-select
                        v-model="currentTemplate"
                        :options="templateOptions"
                        label="Template Style"
                        filled
                        dense
                        emit-value
                        map-options
                      />
                    </div>

                    <!-- Content Flow -->
                    <div class="control-group q-mb-lg">
                      <div class="text-subtitle2 q-mb-sm">Content Flow</div>
                      <q-btn
                        outline
                        icon="mdi-auto-fix"
                        label="Auto-arrange Content"
                        @click="autoArrangeContent"
                        class="full-width q-mb-xs"
                      />
                      <q-btn
                        outline
                        icon="mdi-refresh"
                        label="Clear All Pages"
                        @click="clearAllPages"
                        class="full-width"
                      />
                    </div>

                    <!-- Preview Actions -->
                    <div class="control-group">
                      <div class="text-subtitle2 q-mb-sm">Preview</div>
                      <q-btn
                        color="positive"
                        icon="mdi-eye"
                        label="Preview Newsletter"
                        @click="previewNewsletter"
                        class="full-width q-mb-xs"
                      />
                      <q-btn
                        color="primary"
                        icon="mdi-content-save"
                        label="Save Layout"
                        @click="saveLayout"
                        class="full-width"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';
// import { UI_ICONS } from '../constants/ui-icons';
import { newsletterGenerationService } from '../services/newsletter-generation.service';
import { templateManagementService } from '../services/template-management.service';
import { firestoreService } from '../services/firebase-firestore.service';
import { normalizeDate, formatDate, sortByDateDesc } from '../utils/date-formatter';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';
import type { ContentDoc } from '../types/core/content.types';

const $q = useQuasar();

// Extended UnifiedNewsletter to support draft issues
interface NewsletterIssue extends UnifiedNewsletter {
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  submissions: string[]; // Array of content IDs for new issues
  finalPdfPath?: string; // Path to generated PDF
  type?: 'issue' | 'newsletter'; // Distinguish between new issues and existing newsletters
}

// State
const isLoading = ref(false);
const isCreating = ref(false);
const issues = ref<NewsletterIssue[]>([]);
const approvedSubmissions = ref<ContentDoc[]>([]);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showContentDialog = ref(false);
const showLayoutDialog = ref(false);
const selectedIssue = ref<NewsletterIssue | null>(null);
const isEditing = ref(false);

// Filtering and tabs state
const activeTab = ref('all');
const selectedIssues = ref<string[]>([]);
const autoRefresh = ref(false);
let refreshInterval: number | null = null;

const newIssue = ref({
  title: '',
  issueNumber: '',
  publicationDate: ''
});

const editForm = ref({
  id: '',
  title: '',
  issueNumber: '',
  publicationDate: '',
  status: 'draft' as 'draft' | 'generating' | 'ready' | 'published' | 'archived',
  template: 'standard' as string
});

// Template management state
const showTemplateDialog = ref(false);
const availableTemplates = ref<string[]>([]);
const selectedTemplatePreview = ref<string>('');

// Page layout state
const currentTemplate = ref('standard');
const pages = ref([{ id: 1, areas: [] }]);
const contentAreas = ref([
  { id: 1, contentId: null as string | null, size: 'large' },
  { id: 2, contentId: null as string | null, size: 'medium' },
  { id: 3, contentId: null as string | null, size: 'medium' },
  { id: 4, contentId: null as string | null, size: 'small' }
]);
const draggedContentId = ref<string | null>(null);

// Status options for editing
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Generating', value: 'generating' },
  { label: 'Ready', value: 'ready' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' }
];

// Template options for newsletter layout
const templateOptions = [
  {
    label: 'Standard Newsletter',
    value: 'standard',
    description: 'Classic two-column layout with header and footer'
  },
  {
    label: 'Modern Article Layout',
    value: 'modern',
    description: 'Clean single-column design with emphasis on readability'
  },
  {
    label: 'Event-Focused',
    value: 'event',
    description: 'Optimized for event announcements and calendars'
  },
  {
    label: 'Announcement Style',
    value: 'announcement',
    description: 'Bold design for important announcements'
  },
  {
    label: 'Community Spotlight',
    value: 'community',
    description: 'Highlights community members and achievements'
  }
];

// Computed
const draftIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'draft')
);

const readyIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'ready')
);

const publishedIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'published')
);

const archivedIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'archived')
);

const generatingIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'generating')
);

const newIssues = computed(() =>
  issues.value.filter(issue => issue.type === 'issue')
);

const existingNewsletters = computed(() =>
  issues.value.filter(issue => issue.type === 'newsletter')
);

const availableContent = computed(() =>
  approvedSubmissions.value.filter(submission =>
    !selectedIssue.value?.submissions.includes(submission.id)
  )
);

// Filtered issues based on active tab
const filteredIssues = computed(() => {
  switch (activeTab.value) {
    case 'draft':
      return draftIssues.value;
    case 'published':
      return publishedIssues.value;
    case 'archived':
      return archivedIssues.value;
    case 'generating':
      return generatingIssues.value;
    case 'new-issues':
      return newIssues.value;
    case 'existing':
      return existingNewsletters.value;
    case 'all':
    default:
      return issues.value;
  }
});

// Table columns
const issueColumns = [
  {
    name: 'type',
    label: 'Type',
    align: 'center' as const,
    field: 'type',
    sortable: true,
    format: (val: string) => val === 'issue' ? 'New Issue' : 'Newsletter'
  },
  {
    name: 'title',
    required: true,
    label: 'Title',
    align: 'left' as const,
    field: 'title',
    sortable: true
  },
  {
    name: 'issueNumber',
    label: 'Issue #',
    align: 'left' as const,
    field: 'issueNumber',
    sortable: true
  },
  {
    name: 'publicationDate',
    label: 'Publication Date',
    align: 'left' as const,
    field: 'publicationDate',
    format: (val: Date) => formatDate(val, 'SHORT'),
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center' as const,
    field: 'status',
    sortable: true
  },
  {
    name: 'submissions',
    label: 'Content',
    align: 'center' as const,
    field: 'submissions',
    sortable: false
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: 'actions',
    sortable: false
  }
];

// Methods
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'orange';
    case 'generating': return 'blue';
    case 'ready': return 'positive';
    case 'published': return 'info';
    case 'archived': return 'grey';
    default: return 'grey';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return 'mdi-content-save-edit';
    case 'generating': return 'mdi-cog';
    case 'ready': return 'mdi-check-circle';
    case 'published': return 'mdi-publish';
    case 'archived': return 'mdi-archive';
    default: return 'mdi-help-circle';
  }
};

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'draft': return 'Work in progress, not ready for publication';
    case 'generating': return 'PDF is being generated';
    case 'ready': return 'Ready for publication';
    case 'published': return 'Published and available to public';
    case 'archived': return 'Archived, no longer active';
    default: return 'Unknown status';
  }
};

const getSubmissionTitle = (submissionId: string) => {
  const submission = approvedSubmissions.value.find(s => s.id === submissionId);
  return submission?.title || 'Unknown';
};

const getSubmissionType = (submissionId: string) => {
  const submission = approvedSubmissions.value.find(s => s.id === submissionId);
  if (!submission) return 'Unknown';

  // Extract content type from tags
  const contentType = submission.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1];
  return contentType ? contentType.charAt(0).toUpperCase() + contentType.slice(1) : 'Article';
};

const loadData = async () => {
  isLoading.value = true;
  try {
    // Now we only need to load from the unified newsletters collection
    const [newslettersData, submissionsData] = await Promise.all([
      newsletterGenerationService.getIssues(), // This now returns all newsletters (existing + new issues)
      newsletterGenerationService.getApprovedSubmissions()
    ]);

    // All newsletters are now in the same collection with consistent structure
    issues.value = newslettersData.map((newsletter: NewsletterIssue) => {
      // Use centralized date formatter to handle all date types safely
      const publicationDate = normalizeDate(newsletter.publicationDate) || new Date();

      return {
        ...newsletter,
        publicationDate: publicationDate.toISOString(), // Convert to ISO string for consistency
        type: newsletter.isPublished ? 'newsletter' as const : 'issue' as const
      } as NewsletterIssue;
    }).sort(
      (a, b) => sortByDateDesc(new Date(a.publicationDate), new Date(b.publicationDate))
    );

    approvedSubmissions.value = submissionsData;
  } catch (error) {
    logger.error('Failed to load newsletter data:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load newsletter data'
    });
  } finally {
    isLoading.value = false;
  }
};

const createIssue = async () => {
  if (!newIssue.value.title || !newIssue.value.issueNumber || !newIssue.value.publicationDate) {
    return;
  }

  isCreating.value = true;
  try {
    await newsletterGenerationService.createIssue(
      newIssue.value.title,
      newIssue.value.issueNumber,
      new Date(newIssue.value.publicationDate)
    );

    $q.notify({
      type: 'positive',
      message: 'Newsletter issue created successfully!'
    });

    // Reset form and close dialog
    newIssue.value = { title: '', issueNumber: '', publicationDate: '' };
    showCreateDialog.value = false;

    // Reload data
    await loadData();
  } catch (error) {
    logger.error('Failed to create newsletter issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to create newsletter issue'
    });
  } finally {
    isCreating.value = false;
  }
};

const viewIssue = (issue: NewsletterIssue) => {
  selectedIssue.value = issue;
  showContentDialog.value = true;
};

const layoutPages = (issue: NewsletterIssue) => {
  selectedIssue.value = issue;
  showLayoutDialog.value = true;
};

const viewNewsletter = (newsletter: NewsletterIssue) => {
  // For existing newsletters, open the PDF directly
  if (newsletter.downloadUrl) {
    window.open(newsletter.downloadUrl, '_blank');
  } else {
  $q.notify({
      type: 'warning',
      message: 'No PDF available for this newsletter'
    });
  }
};

const editIssue = (issue?: NewsletterIssue) => {
  if (issue) {
    selectedIssue.value = issue;
  }

  if (!selectedIssue.value) {
    $q.notify({
      type: 'warning',
      message: 'Please select an issue to edit'
    });
    return;
  }

  // Populate edit form with current issue data
  editForm.value = {
    id: selectedIssue.value.id,
    title: selectedIssue.value.title,
    issueNumber: selectedIssue.value.issueNumber || '',
    publicationDate: selectedIssue.value.publicationDate.split('T')[0] || '',
    status: selectedIssue.value.status || 'draft', // Default to draft for existing newsletters
    template: 'standard' // Default template
  };

  showEditDialog.value = true;
};

const updateIssue = async () => {
  if (!editForm.value.title || !editForm.value.issueNumber || !editForm.value.publicationDate) {
    return;
  }

  if (!selectedIssue.value) {
    $q.notify({
      type: 'warning',
      message: 'No issue selected for editing'
    });
    return;
  }

  isEditing.value = true;
  try {
    if (selectedIssue.value.type === 'issue') {
      // Update new issue using newsletter generation service
      await newsletterGenerationService.updateIssue(
        editForm.value.id,
        {
          title: editForm.value.title,
          issueNumber: editForm.value.issueNumber,
          publicationDate: new Date(editForm.value.publicationDate),
          status: editForm.value.status
        }
      );
    } else {
      // Update existing newsletter using firestore service
      await firestoreService.updateNewsletterMetadata(
        editForm.value.id,
        {
          title: editForm.value.title,
          issueNumber: editForm.value.issueNumber,
          publicationDate: new Date(editForm.value.publicationDate).toISOString()
          // Note: existing newsletters don't have status in the same way
        }
      );
    }

    $q.notify({
      type: 'positive',
      message: `${selectedIssue.value.type === 'issue' ? 'Newsletter issue' : 'Newsletter'} updated successfully!`
    });

    // Close dialog and reload data
    showEditDialog.value = false;
    await loadData();
  } catch (error) {
    logger.error('Failed to update newsletter:', error);
    $q.notify({
      type: 'negative',
      message: `Failed to update ${selectedIssue.value.type === 'issue' ? 'newsletter issue' : 'newsletter'}`
    });
  } finally {
    isEditing.value = false;
  }
};

const unpublishIssue = (issue: NewsletterIssue) => {
  if (issue.status !== 'published') {
    $q.notify({
      type: 'warning',
      message: 'Only published newsletters can be unpublished'
    });
    return;
  }

  $q.dialog({
    title: 'Unpublish Newsletter',
    message: `Are you sure you want to unpublish "${issue.title}"? This will change its status to draft.`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Unpublish',
      color: 'warning'
    }
  }).onOk(() => {
    void (async () => {
      try {
        if (issue.type === 'issue') {
          // Unpublish new issue using newsletter generation service
          await newsletterGenerationService.updateIssue(issue.id, {
            status: 'draft'
          });
        } else {
          // For existing newsletters, we can't change their published status
          // as they don't have the same status system
          $q.notify({
            type: 'warning',
            message: 'Existing newsletters cannot be unpublished through this interface'
          });
          return;
        }

        $q.notify({
          type: 'positive',
          message: 'Newsletter unpublished successfully!',
          caption: 'Status changed to draft'
        });

        await loadData();
      } catch (error) {
        logger.error('Failed to unpublish newsletter:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to unpublish newsletter'
        });
      }
    })();
  });
};

const duplicateIssue = async (issue: NewsletterIssue) => {
  if (issue.type !== 'issue') {
    $q.notify({
      type: 'warning',
      message: 'Only new issues can be duplicated'
    });
    return;
  }

  try {
    const duplicatedTitle = `${issue.title} (Copy)`;
    const duplicatedIssueNumber = `${issue.issueNumber}-copy`;
    const duplicatedDate = new Date();
    duplicatedDate.setDate(duplicatedDate.getDate() + 7); // One week from now

    await newsletterGenerationService.createIssue(
      duplicatedTitle,
      duplicatedIssueNumber,
      duplicatedDate
    );

    $q.notify({
      type: 'positive',
      message: 'Issue duplicated successfully!'
    });

    await loadData();
  } catch (error) {
    logger.error('Failed to duplicate issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to duplicate issue'
    });
  }
};

const deleteIssue = (issue: NewsletterIssue) => {
  if (issue.type !== 'issue') {
    $q.notify({
      type: 'warning',
      message: 'Only new issues can be deleted'
    });
    return;
  }

  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${issue.title}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative'
    }
  }).onOk(() => {
    void (async () => {
      try {
        await newsletterGenerationService.deleteIssue(issue.id);

        $q.notify({
          type: 'positive',
          message: 'Issue deleted successfully!'
        });

        await loadData();
      } catch (error) {
        logger.error('Failed to delete issue:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete issue'
        });
      }
    })();
  });
};

const moveContentUp = async (index: number) => {
  if (!selectedIssue.value || selectedIssue.value.type !== 'issue' || index <= 0) return;

  try {
    const submissions = [...selectedIssue.value.submissions];
    const temp = submissions[index - 1]!;
    submissions[index - 1] = submissions[index]!;
    submissions[index] = temp;

    await newsletterGenerationService.addSubmissionsToIssue(
      selectedIssue.value.id,
      submissions
    );

    selectedIssue.value.submissions = submissions;

    $q.notify({
      type: 'positive',
      message: 'Content order updated'
    });
  } catch (error) {
    logger.error('Failed to move content up:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update content order'
    });
  }
};

const moveContentDown = async (index: number) => {
  if (!selectedIssue.value || selectedIssue.value.type !== 'issue' || index >= selectedIssue.value.submissions.length - 1) return;

  try {
    const submissions = [...selectedIssue.value.submissions];
    const temp = submissions[index]!;
    submissions[index] = submissions[index + 1]!;
    submissions[index + 1] = temp;

    await newsletterGenerationService.addSubmissionsToIssue(
      selectedIssue.value.id,
      submissions
    );

    selectedIssue.value.submissions = submissions;

    $q.notify({
      type: 'positive',
      message: 'Content order updated'
    });
  } catch (error) {
    logger.error('Failed to move content down:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update content order'
    });
  }
};

const generatePdf = (issue: NewsletterIssue) => {
  if (issue.type !== 'issue') {
    $q.notify({
      type: 'warning',
      message: 'PDF generation is only available for new issues'
    });
    return;
  }

  if (issue.submissions.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Please add content to the issue before generating PDF'
    });
    return;
  }

  // Show confirmation dialog
  $q.dialog({
    title: 'Generate PDF',
    message: `Generate PDF for "${issue.title}" with ${issue.submissions.length} content items?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Generate PDF',
      color: 'positive'
    }
  }).onOk(() => {
    void (async () => {
      try {
        // Show loading notification
        const loadingNotification = $q.notify({
          type: 'ongoing',
          message: 'Starting PDF generation...',
          caption: 'This may take a few minutes',
          timeout: 0,
          spinner: true
        });

    await newsletterGenerationService.generateNewsletterPdf(issue.id);

        // Update notification to success
        loadingNotification();
    $q.notify({
      type: 'positive',
          message: 'PDF generation started successfully!',
          caption: 'Check back in a few minutes for completion',
          timeout: 5000
    });

    // Reload data to show updated status
    await loadData();

        // Start polling for completion
        startProgressPolling(issue.id);

  } catch (error) {
    logger.error('Failed to generate PDF:', error);
    $q.notify({
      type: 'negative',
          message: 'Failed to start PDF generation',
          caption: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    })();
  });
};

const startProgressPolling = (issueId: string) => {
  const pollInterval = setInterval(() => {
    void (async () => {
      try {
        const progress = await newsletterGenerationService.getGenerationProgress(issueId);

        if (progress) {
          if (progress.status === 'complete') {
            clearInterval(pollInterval);
            $q.notify({
              type: 'positive',
              message: 'PDF generation completed!',
              caption: 'Your newsletter is ready for download',
              timeout: 5000
            });
            await loadData();
          } else if (progress.status === 'error') {
            clearInterval(pollInterval);
            $q.notify({
              type: 'negative',
              message: 'PDF generation failed',
              caption: progress.error || 'Unknown error occurred'
            });
            await loadData();
          }
          // Continue polling for other statuses
        }
      } catch (error) {
        logger.error('Error polling generation progress:', error);
      }
    })();
  }, 10000); // Poll every 10 seconds

  // Stop polling after 10 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
  }, 600000);
};

// Page layout management methods
const handleDragStart = (event: DragEvent, contentId: string) => {
  draggedContentId.value = contentId;
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', contentId);
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  // Handle general drop if needed
};

const handleAreaDrop = (event: DragEvent, areaIndex: number) => {
  event.preventDefault();
  const contentId = event.dataTransfer?.getData('text/plain') || draggedContentId.value;

  if (contentId && contentAreas.value[areaIndex]) {
    contentAreas.value[areaIndex].contentId = contentId;

    $q.notify({
      type: 'positive',
      message: 'Content added to layout area'
    });
  }

  draggedContentId.value = null;
};

const removeFromArea = (areaIndex: number) => {
  if (contentAreas.value[areaIndex]) {
    contentAreas.value[areaIndex].contentId = null;

    $q.notify({
      type: 'info',
      message: 'Content removed from layout area'
    });
  }
};

const addPage = () => {
  const newPageId = pages.value.length + 1;
  pages.value.push({ id: newPageId, areas: [] });

  $q.notify({
    type: 'positive',
    message: `Page ${newPageId} added`
  });
};

const removePage = () => {
  if (pages.value.length > 1) {
    const removedPage = pages.value.pop();
    $q.notify({
      type: 'info',
      message: `Page ${removedPage?.id} removed`
    });
  }
};

const changeTemplate = (templateValue: string) => {
  currentTemplate.value = templateValue;

  // Reset content areas based on template
  switch (templateValue) {
    case 'standard':
      contentAreas.value = [
        { id: 1, contentId: null as string | null, size: 'large' },
        { id: 2, contentId: null as string | null, size: 'medium' },
        { id: 3, contentId: null as string | null, size: 'medium' },
        { id: 4, contentId: null as string | null, size: 'small' }
      ];
      break;
    case 'modern':
      contentAreas.value = [
        { id: 1, contentId: null as string | null, size: 'full' },
        { id: 2, contentId: null as string | null, size: 'large' },
        { id: 3, contentId: null as string | null, size: 'large' }
      ];
      break;
    case 'event':
      contentAreas.value = [
        { id: 1, contentId: null as string | null, size: 'header' },
        { id: 2, contentId: null as string | null, size: 'calendar' },
        { id: 3, contentId: null as string | null, size: 'details' }
      ];
      break;
    default:
      break;
  }

  $q.notify({
    type: 'positive',
    message: `Template changed to ${templateOptions.find(t => t.value === templateValue)?.label}`
  });
};

const autoArrangeContent = () => {
  if (!selectedIssue.value) return;

  // Auto-arrange content in areas
  const submissions = selectedIssue.value.submissions;
  submissions.forEach((submissionId: string, index: number) => {
    if (contentAreas.value[index]) {
      contentAreas.value[index].contentId = submissionId;
    }
  });

  $q.notify({
    type: 'positive',
    message: 'Content auto-arranged in layout areas'
  });
};

const clearAllPages = () => {
  $q.dialog({
    title: 'Clear All Pages',
    message: 'Are you sure you want to clear all content from the layout?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    contentAreas.value.forEach(area => {
      area.contentId = null;
    });

    $q.notify({
      type: 'info',
      message: 'All pages cleared'
    });
  });
};

const previewNewsletter = () => {
  // TODO: Implement newsletter preview
  $q.notify({
    type: 'info',
    message: 'Newsletter preview will open in new tab'
  });
};

const saveLayout = () => {
  if (!selectedIssue.value) return;

  try {
    // TODO: Save layout to newsletter service
    const layoutData = {
      template: currentTemplate.value,
      pages: pages.value,
      contentAreas: contentAreas.value.map(area => ({
        id: area.id,
        contentId: area.contentId,
        size: area.size
      }))
    };

    // For now, just show success message
    $q.notify({
      type: 'positive',
      message: 'Layout saved successfully!'
    });

    logger.info('Layout saved', { issueId: selectedIssue.value.id, layoutData });
  } catch (error) {
    logger.error('Failed to save layout:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to save layout'
    });
  }
};

const downloadPdf = (item: NewsletterIssue) => {
  if (item.downloadUrl) {
    window.open(item.downloadUrl, '_blank');
  } else {
    $q.notify({
      type: 'warning',
      message: 'No PDF available for download'
    });
  }
};

const addToIssue = async (submissionId: string) => {
  if (!selectedIssue.value || selectedIssue.value.type !== 'issue') return;

  try {
    const updatedSubmissions = [...selectedIssue.value.submissions, submissionId];
    await newsletterGenerationService.addSubmissionsToIssue(
      selectedIssue.value.id,
      updatedSubmissions
    );

    selectedIssue.value.submissions = updatedSubmissions;

    $q.notify({
      type: 'positive',
      message: 'Content added to issue'
    });
  } catch (error) {
    logger.error('Failed to add content to issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to add content to issue'
    });
  }
};

const removeFromIssue = async (submissionId: string) => {
  if (!selectedIssue.value || selectedIssue.value.type !== 'issue') return;

  try {
    const updatedSubmissions = selectedIssue.value.submissions.filter(
      (id: string) => id !== submissionId
    );
    await newsletterGenerationService.addSubmissionsToIssue(
      selectedIssue.value.id,
      updatedSubmissions
    );

    selectedIssue.value.submissions = updatedSubmissions;

    $q.notify({
      type: 'positive',
      message: 'Content removed from issue'
    });
  } catch (error) {
    logger.error('Failed to remove content from issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to remove content from issue'
    });
  }
};

// Template management methods
const loadAvailableTemplates = () => {
  try {
    // Use local template info instead of calling the CORS-blocked service
    const localTemplates = ['article', 'event', 'announcement', 'editorial', 'fullpage'];
    availableTemplates.value = localTemplates;

    logger.info('Loaded local templates', { count: localTemplates.length });
  } catch (error) {
    logger.error('Error loading templates:', error);
    // Fallback to basic templates
    availableTemplates.value = ['article', 'event', 'announcement'];
  }
};

const previewTemplate = (templateName: string) => {
  try {
    // Create a local preview since the CORS-blocked service isn't available
    const templateInfo = templateManagementService.getTemplateInfo(templateName);
    const sampleData = templateManagementService.createSampleData('news');

    // Generate a simple HTML preview
    const previewHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border: 2px solid #1976d2; border-radius: 8px; padding: 20px; background: #f5f5f5;">
          <h2 style="color: #1976d2; margin-top: 0;">${templateInfo.displayName}</h2>
          <p style="color: #666; font-style: italic;">${templateInfo.description}</p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <h3 style="color: #333;">Sample Content</h3>
          <h4 style="color: #1976d2;">${sampleData.title}</h4>
          <p style="line-height: 1.6; color: #333;">${sampleData.content}</p>
          <div style="margin-top: 20px; padding: 10px; background: #e3f2fd; border-radius: 4px;">
            <strong>Template Type:</strong> ${templateInfo.contentType}<br>
            <strong>Layout:</strong> ${templateInfo.layout}
          </div>
        </div>
      </div>
    `;

    selectedTemplatePreview.value = previewHtml;

      $q.notify({
      type: 'info',
      message: `Previewing ${templateInfo.displayName}`,
      caption: 'This is a local preview - actual templates may vary'
      });
  } catch (error) {
    logger.error('Error previewing template:', error);
    $q.notify({
      type: 'negative',
      message: 'Error previewing template'
    });
  }
};

const testTemplate = (templateName: string) => {
  try {
    // Since the CORS-blocked service isn't available, show a helpful message
    const templateInfo = templateManagementService.getTemplateInfo(templateName);

      $q.notify({
      type: 'info',
      message: `Template Testing Not Available`,
      caption: `Template "${templateInfo.displayName}" would be tested here. CORS configuration needed for full functionality.`,
      timeout: 5000
    });

    logger.info('Template test requested but CORS service unavailable', { templateName });
  } catch (error) {
    logger.error('Error testing template:', error);
    $q.notify({
      type: 'negative',
      message: 'Error testing template'
    });
  }
};

const getTemplateDisplayName = (templateName: string): string => {
  const info = templateManagementService.getTemplateInfo(templateName);
  return info.displayName;
};

const getTemplateDescription = (templateName: string): string => {
  const info = templateManagementService.getTemplateInfo(templateName);
  return info.description;
};

// Bulk action methods
const showBulkPublishDialog = () => {
  $q.dialog({
    title: 'Bulk Publish',
    message: `Are you sure you want to publish ${selectedIssues.value.length} selected issues?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedIssues.value.map(issueId => {
      const issue = issues.value.find(i => i.id === issueId);
      if (issue && issue.type === 'issue') {
        return newsletterGenerationService.updateIssue(issueId, { status: 'published' });
      }
      return Promise.resolve();
    }))
      .then(() => {
        selectedIssues.value = [];
        void loadData();
        $q.notify({
          type: 'positive',
          message: 'Issues published successfully!'
        });
      })
      .catch((error) => {
        logger.error('Failed to bulk publish issues:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to publish some issues'
        });
      });
  });
};

const showBulkArchiveDialog = () => {
  $q.dialog({
    title: 'Bulk Archive',
    message: `Are you sure you want to archive ${selectedIssues.value.length} selected issues?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedIssues.value.map(issueId => {
      const issue = issues.value.find(i => i.id === issueId);
      if (issue && issue.type === 'issue') {
        return newsletterGenerationService.updateIssue(issueId, { status: 'archived' });
      }
      return Promise.resolve();
    }))
      .then(() => {
        selectedIssues.value = [];
        void loadData();
        $q.notify({
          type: 'positive',
          message: 'Issues archived successfully!'
        });
      })
      .catch((error) => {
        logger.error('Failed to bulk archive issues:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to archive some issues'
        });
      });
  });
};

// Auto-refresh functionality
watch(autoRefresh, (newValue) => {
  if (newValue) {
    refreshInterval = window.setInterval(() => {
      void loadData();
    }, 30000); // Refresh every 30 seconds
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});

// Lifecycle
onMounted(() => {
  void loadData();
  void loadAvailableTemplates();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.q-table {
  font-size: 0.875rem;
}

.q-item {
  border-radius: 4px;
  margin-bottom: 4px;
}

.template-preview-container {
  width: 100%;
  height: 60vh;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.template-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.content-item {
  transition: all 0.2s ease;
}

.content-item:hover {
  background-color: rgba(0, 0, 0, 0.06);
  transform: translateX(2px);
}

/* Page Layout Management Styles */
.page-preview-container {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  min-height: 600px;
}

.page-preview {
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 560px;
  max-width: 400px;
  margin: 0 auto;
  position: relative;
}

.page-header {
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.newsletter-title {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 4px;
}

.newsletter-date {
  font-size: 12px;
  color: #666;
}

.content-areas {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.content-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 16px;
  min-height: 80px;
  transition: all 0.3s ease;
  position: relative;
}

.content-area:hover {
  border-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.05);
}

.content-area.has-content {
  border: 2px solid #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.content-preview {
  position: relative;
}

.content-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}

.content-type {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.remove-content {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
}

.page-footer {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
}

.page-number {
  font-size: 12px;
  color: #666;
}

.content-library-item {
  cursor: grab;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.content-library-item:hover {
  background-color: rgba(25, 118, 210, 0.1);
  transform: translateX(4px);
}

.content-library-item:active {
  cursor: grabbing;
}

.control-group {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 16px;
}

/* Dark mode adjustments */
.q-dark .page-preview-container {
  background: #2a2a2a;
}

.q-dark .page-preview {
  background: #1e1e1e;
  color: white;
}

.q-dark .content-area {
  border-color: #555;
}

.q-dark .content-area:hover {
  border-color: #64b5f6;
  background-color: rgba(100, 181, 246, 0.1);
}

.q-dark .control-group {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
