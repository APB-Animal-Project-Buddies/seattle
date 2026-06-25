import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const query = `
      query GetDish($id: Int!) {
        dishes(where: { id: { _eq: $id } }) {
          id
          dish_name
          dish_data
          created_at
        }
      }
    `;

        const result = await graphql<{ dishes: Array<Record<string, unknown>> }>(query, {
            useAdminSecret: true,
            variables: { id: parseInt(params.id) },
        });

        if (result.errors) {
            return NextResponse.json(
                { error: "Failed to fetch dish" },
                { status: 500 }
            );
        }

        const dish = result.data?.dishes[0];
        if (!dish) {
            return NextResponse.json(
                { error: "Dish not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(dish);
    } catch (error) {
        console.error("Error fetching dish:", error);
        return NextResponse.json(
            { error: "Failed to fetch dish" },
            { status: 500 }
        );
    }
}