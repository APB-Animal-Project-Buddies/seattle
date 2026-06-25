/**
 * POST /api/review-instances
 * 
 * Creates a review instance for a dish.
 * 
 * Request body:
 * {
 *   dishId: number,
 *   name: string,
 *   chefType: "beginner" | "homecook" | "professional",
 *   eventContext?: string,
 *   difficulty: number (1-5),
 *   notes?: string
 * }
 * 
 * Response:
 * { id: string, dishId: number, createdAt: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate required fields
        if (!body.dishId || typeof body.dishId !== "number") {
            return NextResponse.json(
                { error: "Invalid or missing dishId" },
                { status: 400 }
            );
        }

        if (!body.name || !body.name.trim()) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        if (!["beginner", "homecook", "professional"].includes(body.chefType)) {
            return NextResponse.json(
                { error: "Invalid chef type" },
                { status: 400 }
            );
        }

        if (!body.difficulty || body.difficulty < 1 || body.difficulty > 5) {
            return NextResponse.json(
                { error: "Difficulty must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Generate 6-character review instance ID
        const reviewId = nanoid(6);

        // Insert into review_instance via GraphQL
        const mutation = `
        mutation CreateReviewInstance(
            $id: bpchar!
            $dishId: Int!
            $name: String!
            $chefType: String!
            $eventContext: String
            $difficulty: Int!
            $notes: String
        ) {
            insert_review_instance_one(object: {
            id: $id
            dish_id: $dishId
            name: $name
            chef_type: $chefType
            event_context: $eventContext
            difficulty: $difficulty
            notes: $notes
            }) {
            id
            dish_id
            timestamp
            }
        }
        `;

        const result = await graphql(mutation, {
            useAdminSecret: true,
            variables: {
                id: reviewId,
                dishId: body.dishId,
                name: body.name.trim(),
                chefType: body.chefType,
                eventContext: body.eventContext || null,
                difficulty: Number(body.difficulty),
                notes: body.notes || null,
            },
        });

        if (result.errors) {
            console.error("GraphQL errors:", result.errors);
            return NextResponse.json(
                { error: "Failed to create review instance" },
                { status: 500 }
            );
        }

        const review = result.data.insert_review_instance_one;

        return NextResponse.json({
            id: review.id,
            dishId: review.dish_id,
            createdAt: review.timestamp,
            message: "Review submitted successfully",
        });
    } catch (error) {
        console.error("Error creating review instance:", error);
        return NextResponse.json(
            { error: "Failed to create review instance" },
            { status: 500 }
        );
    }
}