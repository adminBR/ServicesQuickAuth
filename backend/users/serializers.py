from rest_framework import serializers

class SumInputSerializer(serializers.Serializer):
    a = serializers.IntegerField()
    b = serializers.IntegerField()
