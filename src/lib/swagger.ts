import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = async (): Promise<Record<string, unknown>> => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "PCF Dashboard API",
        version: "1.0",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          ErrorResponse: {
            type: "object",
            required: ["error"],
            properties: {
              error: { type: "string" },
            },
          },
          ColumnMapping: {
            type: "object",
            required: ["source", "target"],
            properties: {
              source: { type: "string", example: "활동 유형" },
              target: { type: "string", example: "activityType" },
            },
          },
          ImportSummary: {
            type: "object",
            required: ["total", "valid", "warning", "error", "duplicate"],
            properties: {
              total: { type: "integer", example: 30 },
              valid: { type: "integer", example: 26 },
              warning: { type: "integer", example: 3 },
              error: { type: "integer", example: 1 },
              duplicate: { type: "integer", example: 0 },
            },
          },
          ImportRow: {
            type: "object",
            required: [
              "id",
              "rowNumber",
              "date",
              "activityType",
              "sourceName",
              "amount",
              "unit",
              "productCode",
              "productName",
              "emissionFactorId",
              "factor",
              "co2e",
              "status",
              "errors",
              "warnings",
              "raw",
            ],
            properties: {
              id: { type: "string", example: "row-2" },
              rowNumber: { type: "integer", example: 2 },
              date: { type: "string", example: "2025-01-01" },
              activityType: { type: "string", example: "전기" },
              sourceName: { type: "string", example: "한국전력" },
              amount: { type: "string", example: "1200" },
              unit: { type: "string", example: "kWh" },
              productCode: { type: "string", example: "CT-045" },
              productName: { type: "string", example: "CT-045" },
              emissionFactorId: { type: "string", nullable: true },
              factor: { type: "number", nullable: true, example: 0.456 },
              co2e: { type: "number", nullable: true, example: 547.2 },
              status: { type: "string", enum: ["valid", "warning", "error"], example: "valid" },
              errors: { type: "array", items: { type: "string" } },
              warnings: { type: "array", items: { type: "string" } },
              raw: { type: "object", additionalProperties: true },
            },
          },
          EmissionFactor: {
            type: "object",
            required: ["id", "activityType", "sourceName", "scope", "unit", "factor", "validFrom", "validTo"],
            properties: {
              id: { type: "string", example: "9f7e7d6c-0000-4000-9000-000000000001" },
              activityType: { type: "string", example: "전기" },
              sourceName: { type: "string", example: "한국전력" },
              scope: { type: "integer", enum: [1, 2, 3], example: 2 },
              unit: { type: "string", example: "kWh" },
              factor: { type: "number", example: 0.456 },
              validFrom: { type: "string", format: "date", example: "2025-01-01" },
              validTo: { type: "string", format: "date", nullable: true, example: null },
            },
          },
          ImportValidationRequest: {
            type: "object",
            required: ["rows"],
            properties: {
              fileName: { type: "string", example: "2026년_개발자_채용과제.xlsx" },
              sheetName: { type: "string", example: "과제용 데이터" },
              mappings: {
                type: "array",
                items: { "$ref": "#/components/schemas/ColumnMapping" },
              },
              sourceHeaders: {
                type: "array",
                items: { type: "string" },
              },
              rows: {
                type: "array",
                items: { "$ref": "#/components/schemas/ImportRow" },
              },
            },
          },
          ImportPreviewResponse: {
            type: "object",
            required: ["fileName", "sheetName", "mappings", "sourceHeaders", "rows", "summary", "factors"],
            properties: {
              fileName: { type: "string", example: "2026년_개발자_채용과제.xlsx" },
              sheetName: { type: "string", example: "과제용 데이터" },
              mappings: {
                type: "array",
                items: { "$ref": "#/components/schemas/ColumnMapping" },
              },
              sourceHeaders: {
                type: "array",
                items: { type: "string" },
                example: ["일자(원본)", "활동 유형", "설명", "량", "단위"],
              },
              rows: {
                type: "array",
                items: { "$ref": "#/components/schemas/ImportRow" },
              },
              summary: { "$ref": "#/components/schemas/ImportSummary" },
              factors: {
                type: "array",
                items: { "$ref": "#/components/schemas/EmissionFactor" },
              },
            },
          },
          ImportCommitResponse: {
            type: "object",
            required: ["saved", "updated", "skipped", "summary", "rows"],
            properties: {
              saved: { type: "integer", example: 24 },
              updated: { type: "integer", example: 2 },
              skipped: { type: "integer", example: 1 },
              summary: { "$ref": "#/components/schemas/ImportSummary" },
              rows: {
                type: "array",
                items: { "$ref": "#/components/schemas/ImportRow" },
              },
            },
          },
        },
      },
      security: [],
    },
  })
  return spec as Record<string, unknown>
}
